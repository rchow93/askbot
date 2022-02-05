/**
* Buttons to moderate posts
* and the list of edits
*/
var PostModerationControls = function () {
  WrappedElement.call(this);
  this._visibleMessagesById = {};
};
inherits(PostModerationControls, WrappedElement);

/**
* displays feedback message
*/
PostModerationControls.prototype.showMessage = function (message) {
  this._notification.html(message);
  this._notification.parent().fadeIn('fast');
};

PostModerationControls.prototype.hideMessage = function () {
  this._notification.parent().hide();
};

/**
* removes entries from the moderation screen
*/
PostModerationControls.prototype.removeEntries = function (entryIds) {
  /* jshint loopfunc:true */
  for (var i = 0; i < entryIds.length; i++) {
    var id = entryIds[i];
    var elem = this._element.find('.message[data-message-id="' + id + '"]');
    if (elem.length) {
      elem.fadeOut('fast', function () {
        elem.remove();
      });
    }
  }
  /* jshint loopfunc:false */
};

PostModerationControls.prototype.getEntryCount = function () {
  return this.getCheckBoxes().length;
};

PostModerationControls.prototype.getCheckBoxes = function () {
  return this._element.find('.messages input[type="checkbox"]');
};

PostModerationControls.prototype.getSelectedEditIds = function () {
  var checkBoxes = this.getCheckBoxes();
  var num = checkBoxes.length;
  var idList = [];
  for (var i = 0; i < num; i++) {
    var cb = $(checkBoxes[i]);
    if (cb.is(':checked')) {
      var msg = cb.closest('.message-details');
      var msgId = msg.data('messageId');
      idList.push(msgId);
    }
  }
  return idList;
};

/**
* action - one of 'decline-with-reason', 'approve', 'block'
* items - a list of items ['posts', 'users', 'ips']
* not all combinations of action and items are supported
* optReason must be used with 'decline-with-reason' action
*/
PostModerationControls.prototype.getModHandler = function (action, items, optReason) {
  var me = this;
  return function () {
    var selectedEditIds = me.getSelectedEditIds();
    if (selectedEditIds.length === 0) {
      if (action === 'approve') {
        selectedEditIds = [$('.message').first().data('messageId')];
      } else {
        selectedEditIds = me.getVisibleEditIds();
      }
    }
    debugger;
    //@todo: implement undo
    var postData = {
      'edit_ids': selectedEditIds,//revision ids
      'action': action,
      'items': items,//affected items - users, posts, ips
      'reason': optReason || 'none'
    };
    $.ajax({
      type: 'POST',
      cache: false,
      dataType: 'json',
      data: JSON.stringify(postData),
      url: askbot.urls.moderatePostEdits,
      success: function (response_data) {
        if (response_data.success) {
          me.removeEntries(response_data.memo_ids);
          me.setEntryCount(response_data.memo_count);
        }

        var message = response_data.message || '';
        if (me.getEntryCount() < 10 && response_data.memo_count > 9) {
          if (message) {
            message += '. ';
          }
          var junk = $('#junk-mod');
          if (junk.length === 0) {
            junk = me.makeElement('div');
            junk.attr('id', 'junk-mod');
            junk.hide();
            $('body').append(junk);
          }
          var a = me.makeElement('a');
          a.attr('href', window.location.href);
          a.text(gettext('Load more items.'));
          junk.append(a);
          message += a[0].outerHTML;
        }
        if (message) {
          me.showMessage(message);
        }
      }
    });
  };
};

PostModerationControls.prototype.getSelectAllHandler = function (selected) {
  var me = this;
  return function () {
    var cb = me.getCheckBoxes();
    cb.prop('checked', selected);
  };
};

PostModerationControls.prototype.getManuallySelectedCount = function () {
  return this.getSelectedEditIds().length;
};

PostModerationControls.prototype.getVisibleCount = function () {
  var items = this._visibleMessagesById;
  var count = 0;
  for (var obj of Object.entries(items)) {
    if (obj[1]) {
      count += 1;
    }
  }
  return count;
}

PostModerationControls.prototype.getVisibleEditIds = function () {
  var items = this._visibleMessagesById;
  var ids = [];
  for (var obj of Object.entries(items)) {
    if (obj[1]) {
      ids.push(obj[0]);
    }
  }
  return ids;
}
PostModerationControls.prototype.updateApproveButtonGroupLabel = function () {
  var label = this._element.find('.js-approve-block .js-label');
  var numSelected = this.getManuallySelectedCount();
  if (numSelected === 0) {
    label.text(gettext('first post'));
  } else  {
    var formatString = ngettext('%(count)s selected post', '%(count)s selected posts', numSelected);
    label.text(interpolate(formatString, {count: numSelected}, true));
  }
};

PostModerationControls.prototype.updateDeclineButtonGroupLabel = function () {
  var label = this._element.find('.js-decline-block .js-label');
  var numSelected = this.getManuallySelectedCount();
  if (numSelected === 0) {
    var numVisible = this.getVisibleCount();
    var formatString = ngettext('%(count)s visible post', '%(count)s visible posts', numVisible);
    label.text(interpolate(formatString, {count: numVisible}, true));
  } else  {
    var formatString = ngettext('%(count)s selected post', '%(count)s selected posts', numSelected);
    label.text(interpolate(formatString, {count: numSelected}, true));
  }
};

PostModerationControls.prototype.getCheckboxClickHandler = function () {
  var me = this;
  return function() {
    me.updateApproveButtonGroupLabel();
    me.updateDeclineButtonGroupLabel();
  };
};

PostModerationControls.prototype.isIntersectionObserverEntryVisible = function(entry) {
  if (!entry.isIntersecting) return false;
  return true;
  var message = entry.target;
  var messageRect = message.getBoundingClientRect();
  var menuRect = $('.moderation-header')[0].getBoundingClientRect();
  if (messageRect.bottom <= menuRect.bottom) return false;
  return true;
};

PostModerationControls.prototype.setupIntersectionObserver = function () {
  var me = this;
  function obsCallback(entries, observer) {
    entries.forEach(function(entry) {
      var messageId = $(entry.target).data('messageId');
      me._visibleMessagesById[messageId] = me.isIntersectionObserverEntryVisible(entry);
    });
    me.updateDeclineButtonGroupLabel();
  }
  var topMargin = $('.moderation-header')[0].getBoundingClientRect().height;
  var opts = {
    target: null,
    rootMargin: '-' + topMargin + 'px 0% 0% 0%',
    threshold: 0.3
  };
  var obs = new IntersectionObserver(obsCallback, opts);
  var messages = document.getElementsByClassName('message');
  for (var i = 0; i < messages.length; i++) {
    obs.observe(messages[i]);
  }
};

PostModerationControls.prototype.decorate = function (element) {
  this._element = element;
  this._notification = element.find('.action-status span');
  this.hideMessage();

  var cbSet = this.getCheckBoxes();
  setupButtonEventHandlers(cbSet, this.getCheckboxClickHandler());

  //approve posts button
  var button = $('.approve-posts');
  setupButtonEventHandlers(button, this.getModHandler('approve', ['posts']));

  //approve posts and users
  button = $('.approve-posts-users');
  setupButtonEventHandlers(button, this.getModHandler('approve', ['posts', 'users']));

  //decline and explain why
  var reasonsMenuElem = $('.decline-reasons-menu');
  var declineAndExplainMenu = new DeclineAndExplainMenu();
  declineAndExplainMenu.setControls(this);
  declineAndExplainMenu.decorate(reasonsMenuElem);

  //delete posts and block users
  button = element.find('.decline-block-users');
  setupButtonEventHandlers(button, this.getModHandler('block', ['posts', 'users']));

  //delete posts, block users and ips
  button = element.find('.decline-block-users-ips');
  setupButtonEventHandlers(button, this.getModHandler('block', ['posts', 'users', 'ips']));

  this.setupIntersectionObserver();
};

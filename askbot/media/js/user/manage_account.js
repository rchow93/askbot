var AnonymizeDialog = function () {
  ConfirmDialog.call(this);
  this.setHeadingText(gettext('Anonymize and Disable Account'));
  this.setAcceptButtonText(gettext('Yes, anonymize and disable'));
  this.setConfirmTarget($('#js-anonymize-account'));
};
inherits(AnonymizeDialog, ConfirmDialog);

AnonymizeDialog.prototype.getBodyContent = function () {
  var content = this.makeElement('div');
  var question = this.makeElement('p');
  question.html(interpolate(
      gettext("Are you sure you want to anonymize and disable %(user)s's account?"),
      {'user': askbot['data']['viewUserName']},
      true
  ));
  content.append(question);
  var list = new UnorderedList();
  content.append(list.getElement());
  list.append(gettext('All posts will remain on the site'));
  list.append(interpolate(
    gettext('Posts will be attributed to user "%(anon_user)s"'),
    {'anon_user': askbot['data']['anonUserName']},
    true
  ));
  list.append(interpolate(
    gettext("All %(user)s's personal info will be deleted"),
    {'user': askbot['data']['viewUserName']},
    true
  ));
  list.append(gettext('Account will be unusable'));
  return content;
};

var RemoveAccountDialog = function () {
  ConfirmDialog.call(this);
  this.setHeadingText(gettext('Remove Account'));
  this.setAcceptButtonText(gettext('Yes, remove account'));
  this.setConfirmTarget($('#js-remove-account'));
};
inherits(RemoveAccountDialog, ConfirmDialog);

RemoveAccountDialog.prototype.getBodyContent = function () {
  var content = this.makeElement('div');
  var p = this.makeElement('p');
  p.html(gettext('All content will be irreversibly deleted.'));
  content.append(p);
  var p = this.makeElement('p');
  p.html(gettext('Consider anonymizing the data instead if the content may be useful.'));
  content.append(p);
  return content;
};

((function() {
  var anonDialog = new AnonymizeDialog();
  var elem = anonDialog.getElement();
  elem.hide();
  $('body').append(elem);

  var removeDialog = new RemoveAccountDialog();
  var elem = removeDialog.getElement();
  elem.hide();
  $('body').append(elem);
})());

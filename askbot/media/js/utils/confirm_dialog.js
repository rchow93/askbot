var ConfirmDialog = function (triggerButton) {
  ModalDialog.call(this);
  this._confirmed = false;
}
inherits(ConfirmDialog, ModalDialog);

ConfirmDialog.prototype.setConfirmed = function (value) {
  this._confirmed = value
};

ConfirmDialog.prototype.getConfirmed = function () {
  return this._confirmed;
};

ConfirmDialog.prototype.getBodyContent = function () {
  return 'Implement this in your .getBodyContent() method'
}

ConfirmDialog.prototype.setupBodyContent = function () {
  var bodyContent = this.getBodyContent();
  this.setContent(bodyContent)
};

ConfirmDialog.prototype.setConfirmTarget = function (btn) {
  this._confirm_target = btn;
};

ConfirmDialog.prototype.getConfirmTarget = function () {
  return this._confirm_target;
};

ConfirmDialog.prototype.setupTrigger = function () {
  var me = this;
  function anonBtnHandler (evt) {
    if (!me.getConfirmed()) {
      evt.preventDefault();
      me.show();
    }
  }
  setupButtonEventHandlers(this.getConfirmTarget(), anonBtnHandler);
};

ConfirmDialog.prototype.getAcceptHandler = function () {
  var me = this;
  return function () {
    me.hide();
    me.setConfirmed(true);
    me.getConfirmTarget().click();
  }
}

ConfirmDialog.prototype.createDom = function () {
  this.setAcceptHandler(this.getAcceptHandler());
  getSuperClass(ConfirmDialog).createDom.call(this);
  this.setupBodyContent();
  this.setupTrigger();
};

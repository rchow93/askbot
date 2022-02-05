const UnorderedList = function () {
  WrappedElement.call(this);
};
inherits(UnorderedList, WrappedElement);

UnorderedList.prototype.append = function (item) {
  var li = this.makeElement('li')
  li.html(item);
  this._element.append(li);
};

UnorderedList.prototype.createDom = function () {
  this._element = this.makeElement('ul')
};

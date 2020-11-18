Array.prototype.add = function (item) {
  let index = this.indexOf(item);
  if (index == -1) this.push(item);
};

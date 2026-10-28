/**
 * مطابقة قائمة أبو إياد ويا إدخالات المخزن — للمدير بس.
 * هذا ملف ثاني بنفس مشروع Apps Script (بجانب Code.gs). يستخدم الدوال المساعدة اللي بـ Code.gs.
 * الورقة «قائمة أبو إياد» تنسوى وحدها أول مرة.
 */
var AI_SHEET = 'قائمة أبو إياد';
var AI_HEAD = ['التاريخ', 'الأسبوع', 'رقم الصنف', 'SKU', 'الصنف', 'كمية أبو إياد', 'سجّلها', 'وقت التسجيل'];

function aiSheet_() {
  var s = ss_().getSheetByName(AI_SHEET);
  if (!s) {
    s = ss_().insertSheet(AI_SHEET);
    s.getRange(1, 1, 1, AI_HEAD.length).setValues([AI_HEAD]).setFontWeight('bold');
    s.setFrozenRows(1); s.setRightToLeft(true);
    s.getRange(1, 1, s.getMaxRows(), 3).setNumberFormat('@');
  }
  return s;
}
function aiAll_() {
  var s = aiSheet_(), n = s.getLastRow();
  return n < 2 ? [] : s.getRange(2, 1, n - 1, AI_HEAD.length).getValues();
}
// كميات أبو إياد لأسبوع كامل: [{date, itemId, qty}]
function aiWeek_(week) {
  return aiAll_().filter(function (r) { return str_(r[1]) === week; })
    .map(function (r) { return { date: str_(r[0]), itemId: str_(r[2]), qty: num_(r[5]) }; })
    .filter(function (x) { return x.qty != null; });
}
// يبدّل كل كميات يوم واحد بالقائمة الجديدة. items = {رقم الصنف: {qty, sku, name}}
function aiSave_(who, date, items) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, err: 'bad' };
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    var s = aiSheet_(), now = Utilities.formatDate(new Date(), tz_(), 'yyyy-MM-dd HH:mm:ss');
    var keep = aiAll_().filter(function (r) { return str_(r[0]) && str_(r[0]) !== date; })
      .map(function (r) { return [str_(r[0]), str_(r[1])].concat(r.slice(2)); });
    var add = Object.keys(items || {}).map(function (id) {
      var x = items[id] || {};
      return [date, weekOf_(date), String(id), str_(x.sku), str_(x.name), num_(x.qty), who.name, now];
    }).filter(function (r) { return r[5] != null; });
    var all = keep.concat(add);
    var n = s.getLastRow();
    if (n >= 2) s.getRange(2, 1, n - 1, AI_HEAD.length).clearContent();
    if (all.length) {
      s.getRange(2, 1, all.length, 3).setNumberFormat('@');
      s.getRange(2, 1, all.length, AI_HEAD.length).setValues(all);
    }
    return { ok: true, n: add.length };
  } finally {
    lock.releaseLock();
  }
}

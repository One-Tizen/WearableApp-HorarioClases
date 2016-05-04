var DAY_IN_MILLS = 24 * 60 * 60 * 1000;
function getTodayMills() {
	return new Date().getTime();
}
function getTomorrowMills() {
	return getTodayMills() + DAY_IN_MILLS;
}
function getNextWeekMills() {
	return getTodayMills() + 7 * DAY_IN_MILLS;
}

/*function millsToDate(time) {
	return Math.floor(time / DAY_IN_MILLS);
}
function dateToMills(date) {
	return date * DAY_IN_MILLS;
}*/
/*function millsToDate(time) {
	time -= timezoneOffset();
	return Math.floor(time / DAY_IN_MILLS);
}
function dateToMills(date) {
	return date * DAY_IN_MILLS + timezoneOffset();
}*/
function millsToDate(time) {
	return Math.floor((time - timezoneOffset()) / DAY_IN_MILLS);
}
function dateToMills(date) {
	return date * DAY_IN_MILLS + timezoneOffset();
}
function timezoneOffset() {
	return new Date().getTimezoneOffset() * 60000;
}

var DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
var MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
function dateMillsToWeekday(mills) {
	var date = new Date(mills);
	return DAYS[date.getDay()];
}
function dateMillsToDayAndMonth(mills) {
	var date = new Date(mills);
	return date.getDate() + " " + MONTHS[date.getMonth()];
}
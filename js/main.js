function onreceive(channelId, data) {
	var json = JSON.parse(data);
	var action = json.action;
	console.log('onreceive ' + action);
	if (action === "mainfordate") {
		var date = json.date;
		var lessons = json.lessons;
		$('#pagedate-' + date).removeClass('loading-view').removeClass('error-view').empty();
		while (lessons.length > 0) {
			var lesson = lessons.shift();
			var item = instantiateLessonItem(lesson.color, lesson.name, lesson.times, lesson.teacher, lesson.summary);
			item.attr('id', 'item-' + lesson.classid);
			$('#pagedate-' + date).append(item);
		}
		
		$('.day-view').delegate('li > a', 'click', function() {
			mClass = $(this).parent().attr('id').substr(5);
			sendFetch('{"action": "overview", "class": "' + mClass + '"}');
			$('#main-view').hide();
			$('#class-view').addClass('loading-view').show();
			mView = 1;
		});
		
	} else if (action === "overview") {
		var lessons = json.lessons;
		$('.lessons-view').empty();
		$('#class-view').removeClass('error-view').removeClass('loading-view');
		classViewScrollContent(0, 0);
		while (lessons.length > 0) {
			var lesson = lessons.shift();
			var item = instantiateLessonItem(lesson.color, lesson.name, lesson.times, lesson.teacher, lesson.summary);
			$('.lessons-view').append(item);
		}
		var notes = json.notes;
		$('.notes-view').empty();
		while (notes.length > 0) {
			var note = notes.shift();
			var item = instantiateNoteItem(note.text, note.date);
			$('.notes-view').append(item);
		}
		var marks = json.grades;
		$('.marks-view').empty();
		while (marks.length > 0) {
			var mark = marks.shift();
			var item = instantiateMarkItem(mark.grade, mark.text, mark.date);
			$('.marks-view').append(item);
		}
	} else if (action === "addnote") {
		sendFetch('{"action": "overview", "class": "' + mClass + '"}');
	}
}

var mPageDate;
var mClass;
var mView = 0;
$(function() {
	window.addEventListener('tizenhwkey', function(ev) {
		if (ev.keyName == "back") {
			if (mView === 0) {
				tizen.application.getCurrentApplication().exit();
			} else {
				$('#main-view').show();
				$('#class-view').hide();
				mView = 0;
			}
		}
	});
	$('#datePulldown').click(function() {
		$('.dialog:not(#datePulldown-dialog)').hide();
		$('#datePulldown-dialog').toggle('slide');
	});
	$('#moreoverflow').click(function() {
		$('.dialog:not(#moreoverflow-dialog)').hide();
		$('#moreoverflow-dialog').toggle();
	});
	$('#moreoverflow-item-refresh').click(function() {
		$('.dialog').hide();
		$('#pagedate-' + mPageDate).removeClass('error-view').addClass('loading-view').empty();
		sendFetch('{"action": "mainfordate", "date": "' + mPageDate + '"}');
	});
	$('.notes-container li > a').click(function() {
		$('.notes-container li > a').removeClass('selected');
		$(this).addClass('selected');
	});
	$('.lesson-add-view .button').click(function() {
		$('#class-view').addClass('loading-view')
		var note = $('.notes-add-view .selected').text();
		sendFetch('{"action": "addnote", "date": "' + mPageDate + '", "class": "' + mClass + '", "note": "' + note + '"}');
	});
	$('#datePulldown-item-today').click(function() {
		datePulldownClick(getTodayMills());
	});
	$('#datePulldown-item-tomorrow').click(function() {
		datePulldownClick(getTomorrowMills());
	});
	$('#datePulldown-item-next-week').click(function() {
		datePulldownClick(getNextWeekMills());
	});
	$(".pager-view").swipe({
		triggerOnTouchEnd : true,
		swipeStatus : pagerViewSwipeStatus,
		allowPageScroll : "vertical"
	});
	$("#class-view").swipe({
		triggerOnTouchEnd : true,
		swipeStatus : classViewSwipeStatus,
		allowPageScroll : "vertical"
	});
	
	instantiatePulldown();
	instantiateDate(getTodayMills());
	
	mPageDate = millsToDate(getTodayMills());
	console.log("START mPageDate "+ mPageDate);
	instantiatePageAndLoad(mPageDate);
});
function datePulldownClick(mills) {
	$('.dialog').hide();
	instantiateDate(mills);
	var pageDate = millsToDate(mills);
	if (pageDate !== mPageDate) {
		var scroll = (pageDate < mPageDate) ? 0 : body_width;
		instantiatePageAndLoad(pageDate);
		pagerViewScrollContent(scroll, animation_timeout);
		mPageDate = pageDate;
	}
}

var isscrolling;
var nextItem;
var body_width = 320;
var animation_timeout = 500;
function pagerViewSwipeStatus(event, phase, direction, distance, fingers) {
	if (phase == "move" && (direction == "left" || direction == "right")) {
		isscrolling = true;
		nextItem = (direction == "left") ? mPageDate + 1 : mPageDate - 1;
		instantiatePageAndLoad(nextItem);
		if (direction == "left") {
			pagerViewScrollContent(distance, 0);			
		} else {
			pagerViewScrollContent(body_width - distance, 0);
		}
		
	} else if (phase == "cancel" && isscrolling) {
		isscrolling = false;
		nextItem = mPageDate; 
		pagerViewScrollContent((direction == "left") ? 0 : body_width, animation_timeout);
		pagerViewRemoveNotNeeded();
		
	} else if (phase == "end" && isscrolling) {
		isscrolling = false;
		mPageDate = nextItem;
		pagerViewScrollContent((direction == "left") ? body_width : 0, animation_timeout);
		pagerViewRemoveNotNeeded();
		
		instantiateDate(dateToMills(mPageDate));
	}
}
function pagerViewScrollContent(distance, duration) {
	var swipable = $(".pager-view");
	swipable.css("-webkit-transition-duration", (duration/1000).toFixed(1) + "s");
	var value = (distance<0 ? "" : "-") + Math.abs(distance).toString();
	swipable.css("-webkit-transform", "translate3d("+value +"px,0px,0px)");
}
function pagerViewRemoveNotNeeded() {
	setTimeout(function() {
		$('#main-view .scroll-view').each(function() {
			var pageDate = $(this).find('.day-view').attr('pagedate');
			if (pageDate != mPageDate) {
				$(this).remove();
			}
		});
		pagerViewScrollContent(0, 0);
	}, animation_timeout);
}

var classView = 0;
var classViewNextItem;
function classViewSwipeStatus(event, phase, direction, distance, fingers) {
	if ($("#class-view").hasClass("loading-view") || $("#class-view").hasClass("error-view")) {
		return;
	}
	if (classView == undefined) {
		classView = 0;
	}
	if (phase == "move") {
		console.log(direction + ", " + classView);
		if (direction == "left" && classView < 1) {
			classViewNextItem = classView + 1;
			classViewScrollContent(distance, 0);			
		} else if (direction == "right" && classView > 0) {
			classViewNextItem = classView - 1;
			classViewScrollContent(310 - distance, 0);
		}
		
	} else if (phase == "cancel") {
		classViewScrollContent(classView * 310, animation_timeout);

	} else if (phase == "end") {
		classView = classViewNextItem;
		classViewScrollContent(classView * 310, animation_timeout);
	}
}
function classViewScrollContent(distance, duration) {
	var swipable = $("#class-view .scroll-container");
	swipable.css("-webkit-transition-duration", (duration/1000).toFixed(1) + "s");
	var value = (distance<0 ? "" : "-") + Math.abs(distance).toString();
	swipable.css("-webkit-transform", "translate3d("+value +"px,0px,0px)");
}

function instantiatePageAndLoad(pageDate) {
	if (instantiatePage(pageDate)) {
		sendFetch('{"action": "mainfordate", "date": "' + pageDate + '"}');
	}
}
function instantiatePage(pageDate) {
	if ($('#pagedate-' + pageDate).length)
		return false;
	console.log("instantiatePage "+ pageDate);
	var content = '<div class="scroll-view"><ul class="day-view loading-view" id="pagedate-' + pageDate + '" pagedate="' + pageDate +'"></ul></div>';
	if (pageDate < mPageDate) {
		$('.pager-view').prepend(content);
	} else {
		$('.pager-view').append(content);
	}
	return true;
}

function instantiateLessonItem(color, lesson, times, teacher, summary) {
	var view = $('<li><a href="#"><span class="main-line"><span class="color-badge"></span></span><span class="summary-line"></span></a></li>');
	view.find(".color-badge").css('background-color', color);
	view.find(".main-line").append(lesson);
	view.find(".main-line").append('<span class="value">' + times + '</span>');
	view.find(".summary-line").append(teacher);
	view.find(".summary-line").append('<span class="value">' + summary + '</span>');
	return view;
}
function instantiateNoteItem(note, date) {
	var view = $('<li><a href="#"><span class="main-line"></span><span class="summary-line"></span></a></li>');
	view.find(".main-line").append(note);
	view.find(".summary-line").append(date);
	return view;
}
function instantiateMarkItem(mark, note, date) {
	var view = $('<li><a href="#"><span class="left-content"></span><span class="main-line"></span><span class="summary-line"></span></a></li>');
	view.find(".left-content").append(mark);
	view.find(".main-line").append(note);
	view.find(".summary-line").append(date);
	return view;
}

function instantiateDate(mills) {
	$('#datePulldown #date').text(dateMillsToDayAndMonth(mills));
	$('#datePulldown #weekday').text(dateMillsToWeekday(mills));
}
function instantiatePulldown() {
	$('#datePulldown-item-today span').text(dateMillsToWeekday(getTodayMills()));
	$('#datePulldown-item-tomorrow span').text(dateMillsToWeekday(getTomorrowMills()));
	$('#datePulldown-item-next-week span').text(dateMillsToDayAndMonth(getNextWeekMills()));
}
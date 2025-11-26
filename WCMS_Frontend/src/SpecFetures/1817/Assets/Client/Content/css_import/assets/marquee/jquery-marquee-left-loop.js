// JavaScript Document

// SET 01
$(function(){
	// 先取得 div#abgne_marquee ul
	// 接著把 ul 中的 li 項目再重覆加入 ul 中(等於有兩組內容)
	// 再來取得 div#abgne_marquee 的高來決定每次跑馬燈移動的距離
	// 設定跑馬燈移動的速度及輪播的速度
	var $marqueeUl = $('div#abgne_marquee ul'),
		$marqueeli = $marqueeUl.append($marqueeUl.html()).children(),
		_height = $('div#abgne_marquee').height() * -1,
		scrollSpeed = 600,
		timer,
		speed = 3000 + scrollSpeed;
	
	// 把 $marqueeUl 的 top 設為顯示到第二組內容的第一筆
	$marqueeUl.css('top', $marqueeli.length / 2 * _height);
	
	// 幫左邊 $marqueeli 加上 hover 事件
	// 當滑鼠移入時停止計時器；反之則啟動
	$marqueeli.hover(function(){
		clearTimeout(timer);
	}, function(){
		timer = setTimeout(showad, speed);
	});
	
	// 控制跑馬燈移動的處理函式
	function showad(){
		var _now = $marqueeUl.position().top / _height;
		_now = (_now - 1 + $marqueeli.length) % $marqueeli.length;
		
		// $marqueeUl 移動
		$marqueeUl.animate({
			top: _now * _height
		}, scrollSpeed, function(){
			// 如果已經移動到第一組時...則馬上把 top 設為顯示到第二組內容的第一筆
			// 藉此產生不間斷的輪播
			if(_now == 0){
				$marqueeUl.css('top', $marqueeli.length / 2 * _height);
			}
		});
		
		// 再啟動計時器
		timer = setTimeout(showad, speed);
	}
	
	// 啟動計時器
	timer = setTimeout(showad, speed);

	$('a').focus(function(){
		this.blur();
	});
});



// SET 02
(function WAU_small(b) {
    var c = "";
    var a = "";
    if (document.title) {
        a = encodeURIComponent(document.title.replace(/(\?=)|(\/)/g, ""))
    }
    document.write('<img src="http://whos.amung.us/swidget/' + b + "/" + a + c + '" style="display:none;" width="80" height="15" border="0" title="在線人數" />');
    var d = document.createElement("script");
    d.src = "http://waudist.tynt.com/javascripts/TyntLite.js?user=" + b;
    d.type = "text/javascript";
    document.getElementsByTagName("head")[0].appendChild(d)
})('ka7nizlgg070');



// SET 03
var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-10470597-1']);
_gaq.push(['_trackPageview']);
(function() {
    var ga = document.createElement('script');
    ga.type = 'text/javascript';
    ga.async = true;
    ga.src = ('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0];
    s.parentNode.insertBefore(ga, s);
})();




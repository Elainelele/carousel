/*
 * Carousel 1.0
 *
 * Author : zhangjingzhuo
 * Client : sport pc and mobile
 * System : no special requirements
 * Public Function: init getItemCount getSlideLength getCurIndex prev next stop
 *
*/

(function(){
	//获取浏览器前缀
	var prefix = (function(temp){
		var aPrefix = ['' , 'webkit' , 'Moz', 'o', 'ms'];
		var props = "";
		for(var i in aPrefix){
			if(aPrefix[i]){
				props = aPrefix[i] + "Transition";
			}else{
				props = "transition";
			}
			if(temp.style[ props ] !== undefined){
				if(aPrefix[i]) aPrefix[i] = "-" + aPrefix[i] + "-";
				return aPrefix[i].toLowerCase();
			}
		}
		return false;
	})(document.createElement("Carousel"));

	var Carousel = (function(){
		function Carousel(element,options){
			this.settings = $.extend(true,{},$.fn.Carousel.defaults,options||{});
			this.$element = $(element);
			this.movieWidth = 0;
			this.init();
		}

		//公有方法
		Carousel.prototype = {
			init : function(){
				var me = this;
				me.selectors = me.settings.selectors;
				me.cont = me.$element.find(me.selectors.content);
				me.contItem = me.cont.find(me.selectors.contItem);

				me.slideDir = me.settings.direction == 'vertical' ? 1 : -1;
				me.itemCount = me.getItemCount();
				me.slideLength = me.getSlideLength();
				me.curIndex = me.slideIndex = (me.settings.index < me.itemCount && me.settings.index >=0 ) ? me.settings.index : 0;

				me._initLayout();
				if(me.settings.swipable) me._initEvent();
				if(me.settings.controler) me._controler();
				if(me.settings.autoplay){
					me.delay = me.settings.interval || 0;
					me._begin();
				}
			},
			//获取滑动元素的个数
			getItemCount : function(){
				return this.contItem.length;
			},
			//获取滑动的长度（宽度或者高度）
			getSlideLength : function(){
				return this.slideDir == -1 ? this.$element.width() : this.$element.height();
			},
			//获取当前选中元素的index值
			getCurIndex : function(){
				return this.curIndex;
			},
			//上一页
			prev : function(){
				this.stop();
				this._slidePrev();
			},
			//下一页
			next : function(){
				this.stop();
				this._slideNext();
			},
			stop : function(){
				if(this.intervalId){
					clearInterval(this.intervalId);
				}
			},
			//私有方法
			//初始化css样式
			_initLayout : function(){
				var me = this;
				me.contItem.each(function(i){
					var to = i;
					if(i == me.itemCount-1 && me.slideIndex == 0 && me.itemCount > 2){
						to = -1;
					}
					me._move(i,to);
				});
				if(me.curIndex){
					me._translate(-me.curIndex * me.slideLength);
					me.cont.css(prefix+"transition","none");
				}
			},
			//初始化绑定事件
			_initEvent : function(){
				var me = this;
				var cont = this.cont;
				var start,delta,swipeDir;
				me.cont.on("touchstart", _touchStartHandler);

				//处理touchestart事件
				function _touchStartHandler(e){
					if(me.intervalId) me.stop();
					var touches = e.touches[0];
					start = {
						x : touches.pageX,
						y : touches.pageY
					}
					swipeDir = undefined;
					delta = {};
					cont.on("touchmove",_touchMoveHandler);
					cont.on("touchend",_touchEndHandler);
				}

				//处理touchemove事件
				function _touchMoveHandler(e){
					var touches = e.touches[0];
					delta = {
						x : touches.pageX - start.x,
						y : touches.pageY - start.y
					}

					if(typeof swipeDir == "undefined"){
						swipeDir = Math.abs(delta.x) < Math.abs(delta.y) ? 1 : -1;
					}

					if(me.slideDir + swipeDir == 0) return;

					e.preventDefault();
					me.movieWidth = (me.slideDir == -1) ? delta.x : delta.y;
					me._translate(-me.slideIndex * me.slideLength + me.movieWidth);
					cont.css(prefix+"transition","none");

					//只有两个时，需要特殊处理
					if(me.itemCount <= 2 && me.settings.loop){
						if(me.movieWidth < 0){
							me._move(me._cicle(me.slideIndex + 1),me.slideIndex + 1);
						}else{
							me._move(me._cicle(this.slideIndex - 1),me.slideIndex - 1);
						}
					}
				}

				//处理touchend事件
				function _touchEndHandler(e){
					if(me.slideDir + me.swipeDir == 0 || !me.movieWidth) return;

					(me.movieWidth > 0 ) ? me._slidePrev() : me._slideNext();

					if(me.delay) me._begin();
					cont.off("touchmove",_touchMoveHandler);
					cont.off("touchend",_touchEndHandler);
				}

				//动画结束时处理事件
				if(prefix !== false && me.settings.callback && typeof me.settings.callback === "function"){
					cont.on("webkitTransitionEnd msTransitionEnd oTransitionEnd otransitionend ",function(){
						//调用用户自定义callback
						me.settings.callback();
					});
				}

				//窗口调整时处理事件
				$(window).resize(function(){
					me.slideLength = me.getSlideLength();
					me._initLayout();
					me.slideIndex = me.curIndex;
					me._move(me._cicle(me.slideIndex),me.slideIndex+1);
					me._translate(-me.slideIndex * me.slideLength);
				});
			},
			//上一页
			_slidePrev : function(){
				if(!this.settings.loop){
					this.slideIndex = (this.slideIndex <= 0) ? 1 : this.slideIndex;
				}
				this._slide(this.slideIndex - 1);
			},
			//下一页
			_slideNext : function(){
				if(!this.settings.loop){
					this.slideIndex = (this.slideIndex > this.itemCount - 2) ? (this.itemCount - 2) : this.slideIndex;
				}
				this._slide(this.slideIndex + 1);
			},
			//具体实现滑动的方法，当to > this.slideIndex代表下一页，否则代表上一页，滑动结束后将to赋值给当前的slideIndex
			_slide : function(to){
				if(to > this.slideIndex){
					if(this.itemCount > 2) this._move(this._cicle(to) , to+1);
					else this._move(this._cicle(to) , this.slideIndex+1);
				}else{
					if(this.itemCount > 2) this._move(this._cicle(to) , to-1);
					else this._move(this._cicle(to) , this.slideIndex-1);
				}
				this._translate(-to * this.slideLength,-this.slideIndex * this.slideLength);
				this.slideIndex = to;
			},
			_translate : function(to,from){
				if(prefix !== false){
					var transform = (this.slideDir == -1) ? to+"px,0,0" : "0,"+to+"px,0";
					this.cont.css(prefix+"transition","all ease-in-out "+this.settings.duration+"ms");
					this.cont.css(prefix+"transform","translate3D("+transform+")");
				}else{
					this._animate(to,from);
				}
			},
			//说明：如果浏览器不支持transition属性，就调用_animate方法来实现滑动功能
			_animate : function(to, from){
				var me = this;
				var cont = me.cont;

				if(typeof from != "undefined"){
					var startTime = new Date,
						timerId,
						dur = me.settings.duration,
						requestAnimationFrame = window.requestAnimationFrame||
							window.webkitRequestAnimationFrame ||
							window.mozRequestAnimationFrame ||
							window.msRequestAnimationFrame ||
							window.oRequestAnimationFrame;

					//使用WindowAnimationTiming接口来实现动画
					if(requestAnimationFrame){
						timerId = 1;
						function animFun(time) {
							if(!timerId) return false;
							var per = Math.min(1.0, (new Date - startTime) / dur);
							if(per >= 1) {
								timerId = null;
								cont.css("left",to+"px");
								if(me.settings.callback && typeof me.settings.callback === "function"){
									//调用用户自定义callback
									me.settings.callback();
								}
							} else {
								cont.css("left",(Math.round((to - me.movieWidth - from) * per) + from + me.movieWidth)+"px");
								requestAnimationFrame(animFun);
							}
						}
						requestAnimationFrame(animFun);
					}else{
						timerId = setInterval(function(){
							var per = Math.min(1.0, (new Date - startTime) / dur);
							if(per >= 1) {
								clearTimeout(timerId);
								cont.css("left",to+"px");
								if(me.settings.callback && typeof me.settings.callback === "function"){
									//调用用户自定义callback
									me.settings.callback();
								}
							}
							cont.css("left",(Math.round((to - me.movieWidth - from) * per) + from + me.movieWidth)+"px");
						},13);
					}
				}else{
					cont.css("left",to);
				}
			},
			//计算当前哪个元素需要移动进行补位
			_cicle : function(index){
				this.curIndex = (this.itemCount + index % this.itemCount) % this.itemCount;
				console.log("cure:"+this.curIndex);
				if(this.itemCount > 2){
					index = (index >= this.slideIndex) ? (this.curIndex + 1) % this.itemCount : (this.itemCount + (this.curIndex - 1))%this.itemCount;
				}else{
					index = this.curIndex;
				}
				console.log(index);
				return index;
			},
			//将索引值为index的元素移动到to*this.slideLength这个位置上，利用补位的方法来达到无缝循环
			_move : function(index, to){
				var cssPos = (this.slideDir == -1) ? "left" : "top";
				this.contItem.eq(index).css(cssPos,to*this.slideLength+"px");

				if(this.settings.controler && this.itemCount && this.controlItems){
					this.controlItems.eq(this.curIndex).addClass(this.active).siblings().removeClass(this.active);
				}
			},
			//动态生成分页dom结构，并将当前分页选中。当设置controler为true时触发
			_controler : function(){
				var ctr = this.selectors.controle,
					ctrItem = this.selectors.controlItem;

				var ctrClass = ctr.substring(1),
					ctrItemClass = ctrItem.substring(1);

				var ctrHtml = "<div class="+ctrClass+">";
				for(var i = 0; i < this.itemCount; i++){
					ctrHtml += "<span class="+ctrItemClass+"></span>";
				}
				ctrHtml +="</div>";
				this.$element.append(ctrHtml);
				this.controlItems = this.$element.find(ctr).find(ctrItem);
				this.active = this.selectors.active.substring(1);
				this.controlItems.eq(this.slideIndex).addClass(this.active);
			},
			//如果设置autoplay为true时触发自动播放begin方法
			_begin : function(){
				var me = this;
				me.intervalId = setInterval(function(){
					me._slideNext();
				},me.delay);
			}
		};
		return Carousel;
	})();

	$.fn.Carousel = function(options){
		return this.each(function(){
			var $this = $(this),
			instance = $.fn.Carousel.lookup[$this.data('Carousel')];
			//单例模式
			if(!instance){
				$.fn.Carousel.lookup[++$.fn.Carousel.lookup.i] = new Carousel(this,options);
				$this.data('Carousel', $.fn.Carousel.lookup.i);
				instance = $.fn.Carousel.lookup[$this.data('Carousel')];
			}

			if (typeof options === 'string') return instance[options]();
		});
	};
	//由于zepto的data方法只能存储字符串，所以利用lookup对象来存储实例
	$.fn.Carousel.lookup = {i: 0};

	$.fn.Carousel.defaults = {
		index: 0,                   // 初始选中项
		loop: true,           // 是否可循环
		duration: 200,           // 切换时长,ms为单位
		autoplay: true,            // 自动轮播
		interval: 5000,   // 自动轮播间隔,ms为单位
		swipable: true,              //是否可滑动
		direction : 'horizontal',                   //水平
		controler : true,           //是否展示
		selectors: {
			content: '.carousel-cont',
			contItem: '.cont-item',
			controle: '.carousel-controle',
			controlItem: '.control-item',
			active: '.active'
		},
		callback : "" //动画结束的回调函数
	};

	$(function () {
		//通过data-xxx 的方式 实例化插件,这样在页面上就不需要显示调用了
		$('[data-carousel]').Carousel();
	});
})(Zepto || jQuery);
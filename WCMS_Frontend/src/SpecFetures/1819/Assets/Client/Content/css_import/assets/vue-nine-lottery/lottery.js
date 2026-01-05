/* DaTouWang URL: www.datouwang.com */
new Vue({
	el:"#app",
	data:{
	  isStart: 1,	
	  score: 50, //消耗積分
      list:[
	  	{img:'images/vue_nine_lottery/j1.png',title:'謝謝參與'},
		{img:'images/vue_nine_lottery/j2.png',title:'美女一個'},
		{img:'images/vue_nine_lottery/j1.png',title:'BMW一輛'},
		{img:'images/vue_nine_lottery/j2.png',title:'單車一輛'},
		{img:'images/vue_nine_lottery/j1.png',title:'雞蛋一籃'},
		{img:'images/vue_nine_lottery/j2.png',title:'500紅包'},
		{img:'images/vue_nine_lottery/j1.png',title:'USB一個'},
		{img:'images/vue_nine_lottery/j2.png',title:'花一藍'}
	  ],   
	  
	  //獎品1-9 
      index: -1,  // 目前轉動到哪個位置，起點位置
      count: 8,  // 總共有多少個位置
      timer: 0,  // 每次轉動定時器
      speed: 200,  // 初始轉動速度
      times: 0,    // 轉動次數
      cycle: 50,   // 轉動基本次數：即至少需要轉動幾次再進入抽獎環節
      prize: -1,   // 中獎位置
      click: true,
      showToast: false, //顯示中獎彈跳窗 
	},
	
	mounted(){},
	
	methods:{
		startLottery(){
			if (!this.click) { return }
			this.startRoll(); 
		},		
		// 開始轉動
		startRoll () {
			this.times += 1 // 轉動次數
			this.oneRoll() // 轉動過程呼叫的每一次轉動方法，這裡是第一次呼叫初始化
			// 如果目前轉動次數達到要求 && 目前轉到的位置是中獎位置
			if (this.times > this.cycle + 10 && this.prize === this.index) {
			  clearTimeout(this.timer)  // 清除轉動計時器，停止轉動
			  this.prize = -1
			  this.times = 0
			  this.speed = 200
			  this.click = true; 
			  var that = this;
			  setTimeout(res=>{
				that.showToast = true;
			  },500)			                  
			} else {
			  if (this.times < this.cycle) {
				this.speed -= 10  // 加快轉動速度
			  } else if (this.times === this.cycle) { 
				const index = parseInt(Math.random() * 10, 0) || 0;  // 隨機獲得一個中獎位置
          		this.prize = index; //中獎位置,可由後台返回
				if (this.prize > 7) { this.prize = 7 }
			  } else if (this.times > this.cycle + 10 && ((this.prize === 0 && this.index === 7) || this.prize === this.index + 1)) {
				this.speed += 110
			  } else {
				this.speed += 20
			  }      
			  if (this.speed < 40) {this.speed = 40}
			  this.timer = setTimeout(this.startRoll, this.speed)
			}
		},

		// 每一次轉動
		oneRoll () {
		  let index = this.index // 目前轉到哪個位置
		  const count = this.count // 總共有多少個位置
		  index += 1
		  if (index > count - 1) { index = 0 }
		  this.index = index
		},
	}	
	
})
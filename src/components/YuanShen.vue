<script lang="ts">
import { ref, reactive, toRefs } from "vue";
import axios from "axios";
import { ElNotification } from 'element-plus'

const count = ref(0);

export default {
  setup() {
    const data = reactive({
      // 输入链接地址
      inputUrl: "",
      apiUrl: "", // 截取的接口地址
      currentPage: 1, // 当前页
      endId: "0", // 接口参数endId，我理解是最后一条记录的id
      startId: "0", //

      
      isFinish:false, //是否完成
      list_all: [], // 所有记录集合

      cardDrawingAllQuantity:0, // 抽卡总数
      fiveQuantity:0, // 五星数量
      drawCardTime:'', // 抽卡时间
      cardDrawingProbability: 0, // 插卡概率
      cardDrawingSuggestions:'', // 抽卡建议
      fiveLong: 0, // 多久未出五星

      loading: false, // loading

      //返回的列表
      searchList: [],
    });

    interface ListData {
      uid: string;
      gacha_type: string;
      item_id: string;
      count: string;
      time: string;
      lang: string;
      item_type: string;
      rank_type: string;
      id: string;
      name: string;
    }

    // 判断是否输入链接
    let isInputUrl = ()=> {
      let result:boolean = data.inputUrl ? true :false;
      if (!result) {
          ElNotification({
          title: '错误',
          message: '请输入查询链接',
          type: 'error',
        });
      }
      return result;
    }
    // 获取结果列表
    let getList = (ev: any, page: number) => {
      
      // 如果没有链接则不继续执行
      if (!isInputUrl()) {
        return
      }
      

      data.currentPage = page;
      // 请求数据
      requestApi(data.currentPage, "pageDown");
    };

    // 发送请求获取
    let requestApi = (page: number, type: string) => {
      // 截取链接地址
      data.apiUrl = data.inputUrl.substring(data.inputUrl.indexOf("?"));
      data.apiUrl = data.apiUrl.substring(0, data.apiUrl.indexOf("#"));
      data.apiUrl += `&gacha_type=301&size=10&page=${data.currentPage}&end_id=${
        type === "pageDown" ? (data.currentPage === 1 ? "0" : data.endId) : data.startId
      }`;

      // 调用接口
      axios.get("/api" + data.apiUrl).then((response) => {
        if (response.status === 200) {
          if (response.data.data?.list.length > 0) {
            // 保存列表
            data.searchList = response.data.data?.list;
            // 保存endId
            data.endId = data.searchList[data.searchList.length - 1]["id"];
            // 保存startId
            data.startId = '0';

          }
          console.log(response.data.data.list);
        }
      }).catch((err)=>{
        ElNotification({
          title: '错误',
          message: err,
          type: 'error',
        });
      });;
    };

    // 发送分析请求
    let requestAnalyseApi = (list_all:any, analyse_currentPage:number, analyse_endId:string) => {
      
      let page = analyse_currentPage;
      let endId = analyse_endId


      // 截取链接地址
      data.apiUrl = data.inputUrl.substring(data.inputUrl.indexOf("?"));
      data.apiUrl = data.apiUrl.substring(0, data.apiUrl.indexOf("#"));
      data.apiUrl += `&gacha_type=301&size=20&page=${page}&end_id=${
        page === 1 ? "0" : endId
      }`;

      // 调用接口
      axios.get("/api" + data.apiUrl).then((response) => {
        if (response.status === 200) {

          if (response.data.data?.list.length > 0) {
            let listData = response.data.data.list;
          
            // 保存页数
            page++;
            // 保存endId
            endId = listData[listData.length - 1]["id"];
            console.log(endId);
            // 保存列表
            list_all = [...list_all, ...listData];
            // 再次调用
            setTimeout(()=> {
              requestAnalyseApi(list_all, page, endId)
            },300);
            

          } else {
            data.isFinish = true;
            data.list_all = list_all;
            console.log('列表获取成功！');
          }
          
        } 
      }).catch((err)=>{
        data.loading = false;
        ElNotification({
          title: '错误',
          message: err,
          type: 'error',
        });
      });

    }

    // 获取全部数据后，分析结果
    let analyse = (ev: any, page: number) => {
      // 如果没有链接则不继续执行
      if (!isInputUrl()) {
        return
      }

      data.loading = true;
      
      // 参数说明：list_all:列表，page:当前页，endId:结束id，isFinish:是否结束
      requestAnalyseApi([], page, '0'); 

      // 分析结果
      setInterval(()=> {
        console.log('isFinish',data.isFinish)
        if (data.isFinish) {
            data.loading = false;
            data.isFinish = false;
            // 分析结果
            analyseResult();
        }
      },1000);

    }

    // 分析统计结果
    let analyseResult = ()=> {
        console.log('分析完成！');
        // 保存五星集合
        let fiveQuantityList:Array<any> = [];
        // 保存计数
        let count = 0;
        // 抽卡时间计数
        let cardDrawingTime = {
          'morning':0,
          'noon':0,
          'afternone':0,
          'night':0
        }
        // 保存总抽卡次数
        data.cardDrawingAllQuantity = data.list_all.length;
        data.list_all.forEach(element=> {
          count++;
          // 保存五星数据
          if (element['rank_type'] === '5') {
            fiveQuantityList.push(element);
            data.fiveLong = data.fiveLong ? data.fiveLong:count-1;
          }

          // 保存抽卡时间
          let time:string = element['time'].split(' ')[1];
          // 保存修改抽卡小时 00-10 11-13 14-18 19-23
          let timeHour = time.split(':')[0];
          if(timeHour >= '00' && timeHour>='10') {
            cardDrawingTime.morning+=1;
          } else if(timeHour > '10' && timeHour<='13') {
            cardDrawingTime.noon+=1;
          } else if(timeHour > '13' && timeHour<='18') {
            cardDrawingTime.afternone+=1;
          } else {
            cardDrawingTime.night+=1;
          }

        });


        // 保存平均五星概率
        if (fiveQuantityList.length > 0) {
          data.cardDrawingProbability = parseInt((data.list_all.length / fiveQuantityList.length).toString())
        }

        // 保存五星数量
        data.fiveQuantity = fiveQuantityList.length;

        // 抽卡时间
        let cardDrawingTimeHourList = new Array(cardDrawingTime.morning,cardDrawingTime.noon, cardDrawingTime.afternone, cardDrawingTime.night);     
        
        for (let key in cardDrawingTime) {
            if (cardDrawingTime[key] === Math.max(...cardDrawingTimeHourList)) {
                data.drawCardTime = key;
            }
        }

        let suggestion = [
          '金光一闪，五星快来！',
          '快了快了，马上就要来了',
          '等的花儿都谢了！',
        ];

        // 抽卡建议
        if (data.cardDrawingProbability - data.fiveLong > 0 && data.cardDrawingProbability - data.fiveLong < 5) {
          data.cardDrawingSuggestions = suggestion[1];
        } else if (data.cardDrawingProbability - data.fiveLong < 0){
          data.cardDrawingSuggestions = suggestion[2];
        } else {
          data.cardDrawingSuggestions = suggestion[0];  
        }

    }

    // 动态修改列表内容颜色
    let changeCellFontColor = ({
      row,
      rowIndex,
    }: {
      row: ListData;
      rowIndex: number;
    }) => {
      console.log(row);

      let className: string = "";
      switch (row.rank_type) {
        case "4":
          className = "color: purple!important; font-weight: bold;";
          break;
        case "5":
          className = "color: #ffb100!important; font-weight: bold;";
      }
      return className;
    };

    // 上翻页
    let pageUp = () => {
      if (data.currentPage > 1) {
        data.currentPage--;
      } else {
        data.currentPage = 1;
      }

      console.log(data.currentPage);
      if (!data.inputUrl) return;
      requestApi(data.currentPage, "pageUp");
    };

    // 下翻页
    let pageDown = () => {
      data.currentPage += 1;

      if (!data.inputUrl) return;
      requestApi(data.currentPage, "pageDown");
    };

    return {
      getList,
      changeCellFontColor,
      pageUp,
      pageDown,
      isInputUrl,
      analyse,
      analyseResult,
      ...toRefs(data),
    };
  },
};
</script>


<template>
  <el-card class="box-card">
    <template #header>
      <div class="card-header">
        <span>请输入链接地址</span>
        <div>
          <el-button type="primary" @click="getList($event, 1)">显示列表数据</el-button>
          <el-button type="success" @click="analyse($event, 1)">查询统计结果</el-button>
        </div>   
      </div>
    </template>
    <el-input v-model="inputUrl" type="textarea" placeholder="-请填写查询url"></el-input>

    <!-- 分析结果 -->
    <div class="analyse_box">
      <div style="border-bottom:1px solid #ccc; margin-bottom:10px;">以下为最近6个月抽卡数据统计：</div>
      <div class="analyse_item">
        <label>总抽卡次数</label>
        <span>{{cardDrawingAllQuantity}}</span>
      </div>
      <div class="analyse_item">
        <label>五星角色数量</label>
        <span>{{fiveQuantity}}</span>
      </div>
      <div class="analyse_item">
        <label>平均出五星概率</label>
        <span>{{cardDrawingProbability}}抽</span>
      </div>
      <div class="analyse_item">
        <label>多久未出五星</label>
        <span>{{fiveLong}}抽</span>
      </div>
      <div class="analyse_item">
        <label>喜欢的抽卡时间</label>
        <span>{{drawCardTime}}</span>
      </div>
      <div class="analyse_item">
        <label>抽卡建议</label>
        <span>{{cardDrawingSuggestions}}</span>
      </div>

    </div>

    <!-- 表格 -->
    <el-table
      :data="searchList"
      style="width: 100%; margin-top: 20px auto"
      :row-style="changeCellFontColor"
    >
      <el-table-column prop="item_type" label="类型" />
      <el-table-column prop="name" label="名称" />
      <el-table-column prop="rank_type" label="星级" />
      <el-table-column prop="time" label="时间" />
    </el-table>

    <div>
      <a href="#" @click="pageUp()" class="btn_page">返回首页</a>
      <a href="#" @click="pageDown()" class="btn_page">下一页</a>
    </div>
    <!-- <el-pagination v-model:currentPage="currentPage" :page-size="10" :pager-count="11" layout="prev, pager, next" :total="1000" @current-change="getList($event, currentPage)"></el-pagination> -->

    <div></div>
  </el-card>

  <div class="loading_box" v-if="loading">
    <div class="loading">
      <span></span>
      <span></span>
      <span></span>
      <span></span>
      <span></span>
    </div>
    <div class="loading_mask"></div>
  </div>
  
</template>

<style scoped>

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.text {
  font-size: 14px;
}

.item {
  margin-bottom: 18px;
}

.box-card {
  width: 800px;
  margin: 0 auto;
}

.font_color_purple td {
  color: purple !important;
}

.font_color_glod td {
  color: gold !important;
}
.btn_page {
  text-decoration: none;
  padding: 5px 10px 0;
  color: cornflowerblue;
}

.btn_page:hover{
  text-decoration: none;
  color: chocolate;
}

.analyse_box{
  border: 1px solid rgb(219, 219, 219);
  border-radius: 4px;
  margin: 10px 0;
  text-align: left;
  padding: 15px;
  line-height: 30px;
}

.analyse_item {
  width: 50%;
}
.analyse_item > span{
  color:cornflowerblue;
  padding: 0 0 0 10px;
}

.analyse_item > label{
  width: 32%;
  display: inline-block;
}

/* loading */
.loading_box{
  position: absolute;
  height: 100vh;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 100;
}

.loading_mask{
  background-color: rgb(0, 0, 0);
  opacity: .5;
  width: 100%;
  height: 100%;
}

.loading{
  width: 100%;
  height: 40px;
  margin: 10% auto 0;
  position: absolute;
  z-index: 1000;
}
.loading span{
    display: inline-block;
    margin-left: 10px;
    width: 8px;
    height: 100%;
    border-radius: 4px;
    background: lightgreen;
    animation: load 1.5s ease infinite;
}
@keyframes load{
    0%,100%{
        height: 40px;
        margin-left: 10px;
        background: lightgreen;
    }
    50%{
        height: 70px;
        margin: -15px 10px;
        background: lightblue;
    }
}
.loading span:nth-child(2){
    animation-delay:0.2s;
}
.loading span:nth-child(3){
    animation-delay:0.4s;
}
.loading span:nth-child(4){
    animation-delay:0.6s;
}
.loading span:nth-child(5){
    animation-delay:0.8s;
}
</style>

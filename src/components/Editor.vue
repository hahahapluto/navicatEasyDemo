<script setup lang="ts">
import { ElButton, ElPopover, ElInput, ElTable } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import {
  getField,
  queryDatabase,
  sqlQueryDatabase,
} from "../request/api/databaseRequest";

let fieldData = reactive({ data: ["column1", "column2", "column3"] }); // 后端传过来的字段名
const countFieldData = ref(0); // 记录添加到哪个字段

const relationData = ["=", "!=", "<", "<=", ">", ">=", "include"]; // 默认关系的选择列表
const recordRelation = reactive([]);

const andData = ["and", "or", "and not", "or not"];
const recordAnd = reactive([]); // 记录连接词

const field: any = reactive([]); // 字段名
const ifAnd: any = reactive([]); // 是否有and
const selected: any = reactive([]); // 是否被选中
const isShow: any = reactive([]); // 是否展示浮窗
const vauleInput: any = reactive([]); // 记录输入的东西

// 表格信息
let tableData = reactive({
  data: [
    {
      column1: "",
      column2: "",
      column3: "",
    },
  ],
});

let count = ref(0); // 记录加了一个数据
let whichActive = ref(-1); // 记录哪一个活跃状态
const editorItems = ref(null); // 获取滚动条的id
const isIconAddClick = ref(false); // 判断是否是icon按钮点击
let timer = null; // 定时器

// 标记括号
const tagAnd = () => {
  for (let i = 0; i < ifAnd.length; i++) {
    if (i != ifAnd.length - 1 && field[i] != "(") {
      ifAnd[i] = true;

      if (field[i + 1] == ")") {
        ifAnd[i] = false;
      }
    }
  }
};

const basicDataAdd = () => {
  ifAnd.splice(whichActive.value + 1, 0, false);
  isShow.splice(whichActive.value + 1, 0, false);
  selected.splice(whichActive.value + 1, 0, true);
  vauleInput.splice(whichActive.value + 1, 0, "?");
  recordRelation.splice(whichActive.value + 1, 0, "=");
  recordAnd.splice(whichActive.value + 1, 0, "and");

  whichActive.value++;
  count.value++; // 多了一行数据
  editorItems.value.scrollTo({
    top: whichActive.value * 40 - 100,
    behavior: "smooth",
  });
};

// 添加数据(无括号)

const addItem = (index) => {
  isShow[curShow.value] = false; // 取消当前输入框的活跃状态
  whichActive.value = index;
  isIconAddClick.value = true;
  clearTimeout(timer);
  // 初始化数据
  field.splice(whichActive.value + 1, 0, fieldData.data[countFieldData.value]);
  basicDataAdd();

  countFieldData.value++;
  if (countFieldData.value == fieldData.data.length) {
    countFieldData.value = 0;
  }
  timer = setTimeout(() => {
    isIconAddClick.value = false;
  }, 300);
  tagAnd();
};

// 添加数据(有括号)
const hasParenthesesAdd = (index) => {
  isShow[curShow.value] = false; // 取消当前输入框的活跃状态
  whichActive.value = index;
  isIconAddClick.value = true;
  clearTimeout(timer);
  // 左括号
  field.splice(whichActive.value + 1, 0, "(");
  basicDataAdd();

  // 中间数据
  addItem(whichActive.value);

  // 右括号
  field.splice(whichActive.value + 1, 0, ")");
  basicDataAdd();
  timer = setTimeout(() => {
    isIconAddClick.value = false;
  }, 300);
  tagAnd();
};

//点击活跃当前选项
const activeItem = (index) => {
  if (index != curShow.value) {
    isShow[curShow.value] = false; // 取消当前输入框的活跃状态
  }

  if (!isIconAddClick.value) {
    whichActive.value = index;
  }
  editorItems.value.scrollTo({
    top: whichActive.value * 40 - 100,
    behavior: "smooth",
  });
};

const activeItem2 = (index) => {
  if (isShow[curShow.value]) {
    isShow[curShow.value] = false; // 取消当前输入框的活跃状态
  }

  if (!isIconAddClick.value) {
    whichActive.value = index;
  }

  editorItems.value.scrollTo({
    top: whichActive.value * 40 - 100,
    behavior: "smooth",
  });
};

let curShow = ref(-1); // 记录当前或缺的输入框
// 点击要输入输入框的值
const clickInput = (index) => {
  isShow[whichActive.value] = false;
  curShow.value = index;
  isShow[index] = true;
};

// 没有确定修改的输入框的值
let oldVauleInput = "?";
// 聚焦输入框时记录旧值
const recordInputValue = (value) => {
  oldVauleInput = value;
};
// 取消更新数据
const cancleInputValue = (index) => {
  isShow[index] = false;
  vauleInput[index] = oldVauleInput;
};
// 确定更新数据
const deterInputValue = (index) => {
  isShow[index] = false;
};

// 生成sql
async function createSql() {
  let sql = "";
  for (let i = 0; i < field.length; i++) {
    if (selected[i]) {
      if (field[i] == "(") {
        sql += field[i];
      } else if (field[i] == ")") {
        sql += field[i];
        if (ifAnd[i]) {
          sql += " " + recordAnd[i] + " ";
        }
      } else {
        sql += field[i] + " " + recordRelation[i] + " " + vauleInput[i];
        if (ifAnd[i]) {
          sql += " " + recordAnd[i] + " ";
        }
      }
    }
  }
  console.log(sql);
  let sqlData = await sqlQueryDatabase(sql);
  tableData.data = sqlData.data;
}

//上移
const up = () => {
  if (whichActive.value != 0) {
    whichActive.value--;
  }
};

// 下移
const down = () => {
  if (whichActive.value != field.length - 1) {
    whichActive.value++;
  }
};

// 判断是否是左括号
const judgeZuo = (key, index) => {
  judgeLayer(index);
  return key == "(";
};
// 单纯判断是否是左括号不计算层数
const pureJudgeZuo = (key) => {
  return key == "(";
};
// 判断是否是右括号
const judgeYou = (key, index) => {
  youJudgeLayer(index);
  return key == ")";
};
// 单纯是否是右括号判断不计算层数
const pureJudgeYou = (key) => {
  return key == ")";
};
// 判断是添加字段
const judgeAll = (key, index) => {
  judgeLayer(index);
  return key.match(/[A-Za-z]+/); //判断是否含有字母
};

// 判断是第几层
let layer = 0;
const judgeLayer = (index) => {
  layer = 0;
  for (let i = index - 1; i >= 0; i--) {
    if (field[i] == "(") {
      layer++;
    }
    if (field[i] == ")") {
      break;
    }
  }
};
// 右括号的判断层数方式
const youJudgeLayer = (index) => {
  layer = 0;
  let temp = "";
  for (let i = index; i >= 0; i--) {
    if (field[i] == "(" || field[i] == ")") {
      temp += field[i];
    }
  }
  while (temp.includes(")(")) {
    temp = temp.replace(")(", "");
  }
  layer = temp.length;
};
async function getFieldData() {
  let tempFild = await getField();
  // 获取数据
  fieldData.data = tempFild.data;
}

async function getQueryDatabase() {
  let queryData = await queryDatabase();
  // 获取数据
  tableData.data = queryData.data;
}

onMounted(() => {
  getFieldData(); // 获取数据
  getQueryDatabase();
});
</script>

<template>
  <div class="editor">
    <div class="editor-items" ref="editorItems">
      <div
        class="editor-item"
        v-for="(key, index) in field"
        :class="{
          active: index == whichActive,
        }"
        @click="activeItem(index)"
      >
        <div class="zuoParenthesis" v-if="judgeZuo(key, index)">
          <div
            style="width: 35px; height: 40px"
            v-for="i in layer"
            :key="i"
          ></div>
          <input
            type="checkbox"
            :checked="selected[index]"
            @click="selected[index] = !selected[index]"
          />(
        </div>
        <div class="content" v-if="judgeAll(key, index)">
          <div
            style="width: 35px; height: 40px"
            v-for="i in layer"
            :key="i"
          ></div>
          <input
            type="checkbox"
            :checked="selected[index]"
            @click="selected[index] = !selected[index]"
          />
          <!-- 字段选择 -->
          <el-select
            v-model="field[index]"
            class="m-2"
            placeholder="Select"
            @focus="activeItem2(index)"
          >
            <el-option
              v-for="item in fieldData.data"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <!-- 关系选择 -->
          <el-select
            v-model="recordRelation[index]"
            class="m-2 relationship"
            placeholder="Select"
            @focus="activeItem2(index)"
          >
            <el-option
              v-for="item in relationData"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <!-- <div class="common relationship" @click="">等于</div> -->
          <ElPopover :visible="isShow[index]" :width="160" trigger="click">
            <el-input
              v-model="vauleInput[index]"
              placeholder="please input"
              @focus="recordInputValue(vauleInput[index])"
            />
            <div style="text-align: right; margin: 0" class="isDetermine">
              <el-button size="small" text @click="cancleInputValue(index)"
                >取消</el-button
              >
              <el-button
                size="small"
                type="primary"
                @click="deterInputValue(index)"
                >确定</el-button
              >
            </div>
            <template #reference>
              <div class="common value" @click="clickInput(index)">
                {{ vauleInput[index] }}
              </div>
            </template>
          </ElPopover>
          <!-- 连接词 -->
          <el-select
            v-model="recordAnd[index]"
            class="m-2 conjunctions"
            placeholder="Select"
            @focus="activeItem2(index)"
            v-if="ifAnd[index]"
          >
            <el-option
              v-for="item in andData"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <!-- <div class="common conjunctions" @click="" v-if="ifAnd[index]">
            and
          </div> -->
          <div
            class="addIcon add"
            @click="addItem(index)"
            v-if="
              index == field.length - 1 ||
              pureJudgeYou(field[index + 1]) ||
              pureJudgeZuo(field[index - 1])
            "
          >
            <span class="icon iconfont icon-jiahao"></span>
          </div>
          <div
            class="addIcon parentheses"
            v-if="
              index == field.length - 1 ||
              pureJudgeYou(field[index + 1]) ||
              pureJudgeZuo(field[index - 1])
            "
            @click="hasParenthesesAdd(index)"
          >
            <span class="icon iconfont icon-line-parenthesesyuankuohao"></span>
          </div>
        </div>
        <div class="youParenthesis" v-if="judgeYou(key, index)">
          <div
            style="width: 35px; height: 40px"
            v-for="i in layer"
            :key="i"
          ></div>
          <input
            type="checkbox"
            :checked="selected[index]"
            @click="selected[index] = !selected[index]"
          />&nbsp;)
          <!-- 连接词 -->
          <el-select
            v-model="recordAnd[index]"
            class="m-2 conjunctions"
            placeholder="Select"
            @focus="activeItem2(index)"
            v-if="ifAnd[index]"
          >
            <el-option
              v-for="item in andData"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
          <!-- <div class="common conjunctions" @click="" v-if="ifAnd[index]">
            and
          </div> -->
          <div
            class="addIcon add"
            @click="addItem(index)"
            v-if="index == field.length - 1"
          >
            <span class="icon iconfont icon-jiahao"></span>
          </div>
          <div
            class="addIcon parentheses"
            v-if="index == field.length - 1"
            @click="hasParenthesesAdd(index)"
          >
            <span class="icon iconfont icon-line-parenthesesyuankuohao"></span>
          </div>
        </div>
      </div>
      <div class="placeholder"></div>
    </div>
    <div class="editor-add">
      <ElButton @click="addItem(whichActive)">按这里添加</ElButton>
      <ElButton @click="up">上移</ElButton>
      <ElButton @click="down">下移</ElButton>
      <ElButton @click="createSql">按这里立即查询</ElButton>
    </div>
  </div>
  <div class="result">
    <el-table :data="tableData.data" border style="width: 80%; margin: 0 auto">
      <el-table-column
        v-for="key in fieldData.data"
        :prop="key"
        :label="key"
        align="center"
      />
    </el-table>
  </div>
</template>

<style lang="less">
.editor {
  position: relative;
  width: 100%;
  height: auto;
  max-height: 300px;

  .placeholder {
    width: 100%;
    height: 50px;
  }

  .editor-items {
    background-color: #f1f1f1;
    padding: 0 20px;
    max-height: 250px;
    overflow: auto;

    .editor-item {
      display: flex;
      justify-items: center;
      align-items: center;
      width: 100%;
      height: 40px;
      line-height: 40px;
      background-color: #f1f1f1;
      user-select: none;
      .zuoParenthesis,
      .youParenthesis {
        display: flex;
        justify-items: center;
        align-items: center;
      }

      .content {
        display: flex;
        justify-items: center;
        align-items: center;
      }

      .common {
        display: inline-block;
        padding: 0 5px;
      }

      .fieldName {
        width: auto;
        height: 50px;
        line-height: 50px;
        text-decoration: underline;
        color: blue;
      }

      .value {
        height: 28px;
        line-height: 28px;
        text-align: center;
        background-color: rgb(255, 255, 255);
        color: #409eff;
        font-weight: 700;
        font-size: 14px;
        border-radius: 5px;
        margin: 0 8px;
      }

      .relationship {
        width: 80px !important;

        .el-input__wrapper {
          background-color: #0075ff;
          padding: 0 !important;
          .el-input__inner {
            color: #fff !important;
            text-align: center !important;
            vertical-align: middle;
          }
        }
        .el-input__suffix {
          display: none !important;
        }
      }

      .conjunctions {
        width: 80px !important;
        .el-input__wrapper {
          background-color: #0075ff;
          padding: 0 !important;
          .el-input__inner {
            color: #fff !important;
            text-align: center !important;
            vertical-align: middle;
          }
        }
        .el-input__suffix {
          display: none !important;
        }
      }

      .addIcon {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 20px;
        height: 20px;
        background-color: #469bfcbb;
        color: #fff;
      }
      .add {
        margin-left: 40px;
      }

      .parentheses {
        margin-left: 20px;
      }

      .addIcon:hover {
        background-color: #0075ff;
      }
    }

    .editor-item.active {
      background-color: #dddddd;
    }
  }

  .editor-items::webkit-scrollbar {
    display: none;
  }

  .editor-add {
    width: 92%;
    height: 50px;
    line-height: 50px;
    background-color: #f1f1f1;
    position: absolute;
    left: 0;
    bottom: 0;
    padding: 0 20px;
  }
}

.el-popper {
  margin-top: -10px !important;

  .isDetermine {
    margin-top: 5px !important;
    margin-bottom: -5px !important;
  }
}
.result {
  margin-top: 20px;
  user-select: none;
}

.el-input__wrapper {
  width: 100px !important;
  height: 28px !important;
  margin: 0 5px;
}
</style>
../request/api/databaseRequest

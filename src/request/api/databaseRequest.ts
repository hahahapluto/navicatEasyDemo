import service from "..";
//获取数据库信息
export function getField() {
  return service({
    method: "get",
    url: "/filter/getField",
  });
}

export function queryDatabase() {
  return service({
    method: "post",
    url: "/filter/queryDatabase",
  });
}

export function sqlQueryDatabase(sql) {
  return service({
    method: "post",
    url: `/filter/queryDatabase?condition=${sql}`,
  });
}

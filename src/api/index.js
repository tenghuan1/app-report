import request from "./axios";

// 示例API请求
export const api = {
  // 通用方法：根据SQL ID查询数据
  // 请求参数格式: {"data":{"SqlId":"你的SQLID","patientInfo":{"参数名":"参数值"}}}
  async executeData(sqlId, params) {
    const data = await request({
      url: "/v1/HosData/ExecuteData",
      method: "post",
      headers: {
        'Content-Type': "application/json"
      },
      data: {
        sqlId: sqlId,
        params
      }
    });
    return data;
  },

};

export default api;

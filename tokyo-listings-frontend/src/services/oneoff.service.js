import http from "../http-common";

const searchSuumo = propId => {
  return http.get(`/oneoff/suumoSearch/${propId}`);
};

const oneoffService = {
  searchSuumo
};

export default oneoffService;

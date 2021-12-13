import http from "../http-common";

const getAll = () => {
  return http.get("/ranking");
};

const create = data => {
  return http.post("/ranking", data);
};

const update = (id, data) => {
  return http.put(`/ranking/${id}`, data);
};

const getWithQuery = query => {
  return http.get('/ranking/' + query);
};

const remove = id => {
  return http.delete(`/ranking/${id}`);
};

const rankingService = {
  getAll,
  getWithQuery,
  create,
  update,
  remove
};

export default rankingService;

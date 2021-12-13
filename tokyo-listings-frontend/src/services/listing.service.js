import http from "../http-common";

const getAll = () => {
  return http.get("/listing");
};

const create = data => {
  return http.post("/listing", data);
};

const update = (id, data) => {
  return http.put(`/listing/${id}`, data);
};

const remove = id => {
  return http.delete(`/listing/${id}`);
};

const getWithQuery = query => {
  return http.get('/listing/' + query);
};

const getByInterest = (interest, query) => {
  return http.get(`/listing/interest/${interest}` + query);
};

const listingService = {
  getAll,
  getWithQuery,
  getByInterest,
  create,
  update,
  remove
};

export default listingService;

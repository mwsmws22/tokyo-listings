import http from "../http-common";

const getAll = () => {
  return http.get("/property");
};

const create = data => {
  return http.post("/property", data);
};

const update = (id, data) => {
  return http.put(`/property/${id}`, data);
};

const getWithQuery = query => {
  return http.get('/property/' + query);
};

const getWithChildren = query => {
  return http.get('/property/withChildren/' + query);
};

const remove = id => {
  return http.delete(`/property/${id}`);
};

const propertyService = {
  getAll,
  getWithQuery,
  create,
  update,
  remove,
  getWithChildren
};

export default propertyService;

const axiosLib = require('axios');
const cookieParser = require('cookie-parser');
const { parse: setCookieParse } = require('set-cookie-parser');

module.exports = function expressAxiosCookieProxy(req, res, next) {
  const usableAxiosLib = req.axios || axiosLib;

  const axiosInstance = usableAxiosLib.create();

  axiosInstance.interceptors.request.use((request) => {
    if (!request.proxyCookies) return request;

    if (!req.cookies) cookieParser()(req, res, () => null);

    const { headers: { cookie: cookiesInAxiosReq = '' } = {} } = request;

    const { cookie: cookiesInExpressReq = '' } = req.headers;

    const cookie = [cookiesInExpressReq, cookiesInAxiosReq].filter(it => it).join('; ');

    request.headers = { ...request.headers, cookie };

    return request;
  });

  axiosInstance.interceptors.response.use((response) => {
    if (!response.config.proxyCookies) return response;

    const setCookie = setCookieParse(response.headers['set-cookie'] || "");
    setCookie.forEach(({ name, value, maxAge, ...rest }) => {
      maxAge = maxAge !== undefined ? maxAge * 1000 : undefined;
      res.cookie(name, value, { ...rest, maxAge });
    });

    return response;
  });

  req.axios = res.axios = axiosInstance;

  next();
}

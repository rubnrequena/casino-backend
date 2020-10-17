class RedisCache {
  static MENUS = "cache-menus";
  static PERMISOS = "cache-permisos";
  static OPERADORAS = "cache-operadoras";
  static BALANCE = "cache-balance";
  static BALANCE_MONEDA = "cache-bal-moneda";
  static MONEDA = "cache-moneda";
  static ESTADISTICAS = "cache-estadisticas";
  static NUMEROS = "cache-numeros";
  static SORTEOS = "cache-sorteos";

  static CAST_NUMBER = "number";
  static CAST_JSON = "json";

  static EXPIRE_1HORA = 60 * 60;
}
module.exports = RedisCache;

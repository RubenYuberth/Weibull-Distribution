import { formatLocale } from "d3-format";

const esES = formatLocale({
  decimal: ",",
  thousands: ".",
  grouping: [3],
  currency: ["", " €"],
  minus: "\u2212",
  nan: "ND",
});

export const fmtValue = esES.format(".4~g");
export const fmtTick = esES.format(".3~g");

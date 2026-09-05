export default function AnalyticsList({ items, labelKey, valueKey, valueFormatter = (value) => value }) {
  const maximum = Math.max(...items.map((item) => item[valueKey]), 1)
  return <div className="analytics-list">{items.map((item) => <div className="analytics-list-row" key={item[labelKey]}><div className="analytics-list-label"><strong>{item[labelKey]}</strong><span>{valueFormatter(item[valueKey])}</span></div><div className="list-track"><span style={{ width: `${(item[valueKey] / maximum) * 100}%` }} /></div></div>)}</div>
}

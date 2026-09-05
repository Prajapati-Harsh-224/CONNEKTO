export default function BarChart({ items, valueKey = 'value', labelKey = 'label', valueFormatter = (value) => value }) {
  const maximum = Math.max(...items.map((item) => item[valueKey]), 1)
  return <div className="bar-chart">{items.map((item) => <div className="bar-item" key={item[labelKey]}><div className="bar-track"><span className="bar-fill" style={{ height: `${(item[valueKey] / maximum) * 100}%` }} /></div><strong>{valueFormatter(item[valueKey])}</strong><span>{item[labelKey]}</span></div>)}</div>
}

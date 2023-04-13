const linechart = (country) => {
  // set the dimensions and margins of the graph

  // append the svg object to the div of the page

  const svg = d3.select('#line_chart')
  const margin = { top: 20, right: 20, bottom: 150, left: 40 }
  const width = +svg.attr('width') - margin.left - margin.right
  const height = +svg.attr('height') - margin.top - margin.bottom
  let g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

  let countriesNameData = []
  let formattedData = []

  d3.csv('./assets/codes/COUNTRY.csv', function (data) {
    countriesNameData.push(data)
  })

  //Read the data
  d3.csv(
    '../assets/WHOSIS_000016.csv',

    // When reading the csv, I formatted variables:
    function (d) {
      formattedData.push(d)
      return {
        date: d3.timeParse('%Y-%m-%d')(d.TimeDimensionBegin),
        value: d.NumericValue,
        Code: d.SpatialDimensionValueCode,
      }
    }
  ).then(
    // Now I can use this dataset:
    function (data) {
      formattedData.forEach((f) => {
        countriesNameData.forEach((c) => {
          if (f.SpatialDimensionValueCode === c.Code) {
            return (
              (f.Continent = c.ParentTitle), (f.ContinentCode = c.ParentCode), (f.Country = c.Title)
            )
          }
        })
      })

      let countryData = d3.group(data, (d) => d.Code)

      let c = countriesNameData.find((d) => d.Code === country)

      document.querySelector('#country_name').innerHTML = c.Title

      data = countryData.get(country)
      // Add X axis --> it is a date format
      const x = d3
        .scaleTime()
        .domain(
          d3.extent(data, function (d) {
            return d.date
          })
        )
        .range([0, width])

      svg.selectAll('*').remove()
      g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

      g.append('g').attr('transform', `translate(0, ${height})`).call(d3.axisBottom(x))

      // Add Y axis
      const y = d3
        .scaleLinear()
        .domain([
          0,
          d3.max(data, function (d) {
            return +d.value
          }),
        ])
        .range([height, 0])

      g.append('g').call(d3.axisLeft(y))

      // Add the line
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'steelblue')
        .attr('stroke-width', 1.5)
        .attr(
          'd',
          d3
            .line()
            .x(function (d) {
              return x(d.date)
            })
            .y(function (d) {
              return y(d.value)
            })
        )
    }
  )
}

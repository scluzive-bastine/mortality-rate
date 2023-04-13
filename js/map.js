const chloropleth = () => {
  // Set the dimensions of the map container
  const width = 550
  const height = 500

  // Define the projection and path for the map
  const projection = d3
    .geoMercator()
    .scale(150)
    .translate([width / 2, height / 2])
  const path = d3.geoPath(projection)

  // Create the SVG element and set its dimensions
  const svg = d3
    .select('#chloropleth_chart')
    .append('svg')
    .attr('width', width)
    .attr('height', height)

  const countries = new Map()
  let countriesNameData = []

  // Load the geojson data for the world map
  d3.csv('./assets/codes/COUNTRY.csv', function (data) {
    countriesNameData.push(data)
  })
  d3.json(
    'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'
  ).then(function (geojson) {
    // Load the data for the number of deaths per country
    d3.csv('./assets/MDG_0000000007.csv').then(function (data) {
      let countriesData = [data] // getting all the countries data

      let filteredData = countriesData[0].filter(function (d) {
        return (
          d.SpatialDimension === 'COUNTRY' &&
          d.TimeDim === '2020' &&
          d.DisaggregatingDimension1ValueCode === 'BTSX' &&
          d.SpatialDimensionValueCode !== 'GLOBAL'
        )
      })
      filteredData.forEach((f) => {
        countriesNameData.forEach((c) => {
          if (f.SpatialDimensionValueCode === c.Code) {
            return (
              (f.Continent = c.ParentTitle), (f.ContinentCode = c.ParentCode), (f.Country = c.Title)
            )
          }
        })
      })

      filteredData.forEach((d) => {
        countries.set(d.SpatialDimensionValueCode, [+d.NumericValue, d.Country])
      })

      // d.total = countries.get(d.id) || 0
      // return colorScale(Math.round(d.total * 10000000))

      // Set the color scale for the map
      const colorScale = d3
        .scaleQuantize()
        .domain([0, d3.max(countries, (d) => +d[1][0])])
        .range(d3.schemeReds[9])

      // Create the map
      svg
        .selectAll('path')
        .data(geojson.features)
        .enter()
        .append('path')
        .attr('d', path)
        .attr('fill', function (d) {
          d.total = countries.get(d.id) || 0
          return colorScale(d.total ? Math.round(d.total[0]) : 0)
        })
        .on('mouseover', function (event, d) {
          const countryData = countries.get(d.id) || 0
          d3.select(this).attr('stroke', '#333').attr('stroke-width', 1)
          tooltip.transition().duration(200).style('opacity', 0.9)
          tooltip
            .html(
              `<div class="fw">${d.properties.name}</div>` +
                `<div class="fw">${
                  countryData ? Math.round(countryData[0]) : 'No data available'
                }</div>`
            )
            .style('left', event.x + 10 + 'px')
            .style('top', event.y - 28 + 'px')
          d3.select(this).style('cursor', 'pointer')
        })
        .on('mouseout', function (d) {
          d3.select(this).attr('stroke', '#fff').attr('stroke-width', 0.1)
          tooltip.transition().duration(500).style('opacity', 0)
        })
        .on('click', function (d) {
          // console.log(d.srcElement.__data__.id)
          linechart(d.srcElement.__data__.id)
        })

      // Create the legend
      const legend = svg.append('g').attr('transform', 'translate(20, 400)')

      const legendTitle = legend
        .append('text')
        .attr('x', 0)
        .attr('y', -10)
        .style('font-size', '14px')
        .text('Number of deaths')

      const legendScale = d3
        .scaleLinear()
        .domain([0, d3.max(countries, (d) => +d[1][0])])
        .range([0, 200])

      const legendAxis = d3
        .axisBottom(legendScale)
        .tickValues(colorScale.range().map((x) => colorScale.invertExtent(x)[1]))
        .tickFormat(d3.format('.0s'))

      const legendG = legend.append('g').call(legendAxis).attr('transform', 'translate(0,10)')

      legendG.select('.domain').remove()
      legendG
        .selectAll('rect')
        .data(colorScale.range())
        .join('rect')
        .attr('width', 20)
        .attr('height', 8)
        .attr('x', (d, i) => i * 20)
        .attr('fill', (d) => d)

      //   // Create the tooltip element
      const tooltip = d3
        .select('#chloropleth_chart')
        .append('div')
        .attr('class', 'tooltip')
        .style('opacity', 0)

      // Enable zooming and panning on the map
      svg.call(
        d3
          .zoom()
          .extent([
            [0, 0],
            [width, height],
          ])
          .scaleExtent([1, 8])
          .on('zoom', function (event) {
            svg.selectAll('path').attr('transform', event.transform)
          })
      )
    })
  })
}

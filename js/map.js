const choropleth = () => {
  // The svg
  const svg = d3.select('#choropleth_chart'),
    width = +svg.attr('width'),
    height = +svg.attr('height')

  // Map and projection
  const projection = d3
    .geoMercator()
    .scale(70)
    .center([0, 20])
    .translate([width / 2, height / 2])

  const path = d3.geoPath()

  // Data and color scale
  const data = new Map()
  const countries = new Map()
  let countriesData = []
  const colorScale = d3
    .scaleThreshold()
    .domain([100000, 1000000, 10000000, 30000000, 100000000, 500000000])
    .range(d3.schemeBlues[7])

  // Load external data and boot
  Promise.all([
    d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson'),
    d3.csv(
      'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv',
      function (d) {
        // console.log(d)
        data.set(d.code, +d.pop)
      }
    ),
    d3.csv('./assets/MDG_0000000007.csv', function (d) {
      countriesData.push(d)
    }),
  ]).then(function (loadData) {
    let topo = loadData[0]

    let filteredData = countriesData.filter(function (d) {
      return (
        d.SpatialDimension === 'COUNTRY' &&
        d.TimeDim === '2020' &&
        d.DisaggregatingDimension1ValueCode === 'BTSX' &&
        d.SpatialDimensionValueCode !== 'GLOBAL'
      )
    })

    filteredData.forEach((d) => {
      countries.set(d.SpatialDimensionValueCode, +d.NumericValue)
    })
    // countries.set(filteredData.SpatialDimensionValueCode, +filteredData.NumericValue)

    // console.log(countries)

    let mouseOver = function (d) {
      d3.selectAll('.Country').transition().duration(200).style('opacity', 0.5)
      d3.select(this).transition().duration(200).style('opacity', 1).style('stroke', 'black')
    }

    let mouseLeave = function (d) {
      d3.selectAll('.Country').transition().duration(200).style('opacity', 0.8)
      d3.select(this).transition().duration(200).style('stroke', 'transparent')
    }

    // console.log(data)
    // console.log(countries)

    // Draw the map
    svg
      .append('g')
      .selectAll('path')
      .data(topo.features)
      .enter()
      .append('path')
      // draw each country
      .attr('d', d3.geoPath().projection(projection))
      // set the color of each country
      .attr('fill', function (d) {
        // console.log(d)
        d.total = countries.get(d.id) || 0
        return colorScale(Math.round(d.total * 10000000))
      })
      .style('stroke', 'transparent')
      .attr('class', function (d) {
        return 'Country'
      })
      .style('opacity', 0.8)
      .on('mouseover', mouseOver)
      .on('mouseleave', mouseLeave)
  })

  // Add zoom
}

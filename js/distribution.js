const distribution = (c) => {
  let countries = [],
    countriesData = []

  Promise.all([
    d3.csv('./assets/MDG_0000000007.csv', function (d) {
      countriesData.push(d)
    }),
    d3.csv('./assets/codes/COUNTRY.csv', function (d) {
      countries.push(d)
    }),
  ]).then(function (data) {
    console.log(c)
    chart(countriesData)
  })

  const chart = (data) => {
    // Select countryData that has SpatialDimension = Country and TimeDimension = 2020
    const filteredData = data.filter(function (d) {
      return d.SpatialDimension === 'COUNTRY' && d.TimeDim === '2020'
    })

    filteredData.forEach((f) => {
      countries.forEach((c) => {
        if (f.SpatialDimensionValueCode === c.Code) {
          return (
            (f.Continent = c.ParentTitle), (f.ContinentCode = c.ParentCode), (f.Country = c.Title)
          )
        }
      })
    })
    // let newCountriesData = d3.group(filteredData, (d) => d.ContinentCode)

    //   Merge countries together and add new values for the sex values for male, female and both sexes
    let mergedData = Array.from(
      d3.group(filteredData, (d) => d.SpatialDimensionValueCode).values()
    ).map((group) => {
      const { SpatialDimensionValueCode, ContinentCode, Continent, Country } = group[0]
      let BothSex, Female, Male
      group.map((g) => {
        if (g.DisaggregatingDimension1ValueCode === 'BTSX') {
          BothSex = +g.NumericValue
        } else if (g.DisaggregatingDimension1ValueCode === 'FMLE') {
          Female = +g.NumericValue
        } else {
          Male = +g.NumericValue
        }
      })
      return { SpatialDimensionValueCode, ContinentCode, Continent, BothSex, Female, Male, Country }
    })

    mergedData = d3.group(mergedData, (g) => g.ContinentCode).get(c)

    // let dd = mergedData.get(c)

    // Draw the chart
    // Set up the SVG element

    const svg = d3.select('#distribution_chart')
    const margin = { top: 20, right: 20, bottom: 150, left: 40 }
    const width = +svg.attr('width') - margin.left - margin.right
    const height = +svg.attr('height') - margin.top - margin.bottom
    let g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // Define the data
    // const data = [  { country: 'USA', male: 1000, female: 800, both: 1800 },  { country: 'Canada', male: 600, female: 500, both: 1100 },  { country: 'Mexico', male: 800, female: 700, both: 1500 },  // Add more countries as needed];

    // Set up the scales
    const xScale = d3
      .scaleBand()
      .rangeRound([0, width])
      .paddingInner(0.1)
      .domain(mergedData.map((d) => d.Country))

    const yScale = d3
      .scaleLinear()
      .rangeRound([height, 0])
      .domain([0, d3.max(mergedData, (d) => d.BothSex)])

    // Define the colors for each sex
    const color = d3.scaleOrdinal().range(['#018dc9', '#E91E63', '#795548'])
    svg.selectAll('*').remove()
    g = svg.append('g').attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

    // Create the bars
    g.selectAll('.bar')
      .data(mergedData)
      .enter()
      .append('g')
      .attr('class', 'bar')
      .attr('transform', (d) => 'translate(' + xScale(d.Country) + ',0)')
      .selectAll('rect')
      .data((d) => {
        return [
          { sex: 'male', value: d.Male },
          { sex: 'female', value: d.Female },
          { sex: 'both', value: d.BothSex },
        ]
      })
      .enter()
      .append('rect')
      .attr('x', (d) => (xScale.bandwidth() / 3) * ['male', 'female', 'both'].indexOf(d.sex))

      //   .attr('height', (d) => height - y(0)) // always equal to 0
      //   .attr('y', (d) => y(0))

      .attr('y', (d) => yScale(d.value))
      .attr('height', (d) => height - yScale(d.value))
      //   .attr('height', (d) => height - yScale(0))
      .attr('width', xScale.bandwidth() / 3)
      .attr('fill', (d) => color(d.sex))
      .selectAll('text')

    // Add the X axis
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(xScale))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')

    // Add the Y axis
    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(yScale).ticks(null, 's'))
      .append('text')
      .attr('x', 2)
      .attr('y', yScale(yScale.ticks().pop()) + 0.5)
      .attr('dy', '-1.32em')
      .attr('fill', '#000')
      .attr('font-weight', 'bold')
      .attr('text-anchor', 'middle')
      .text('Number of Deaths')

    // Add the legend
    const legend = g
      .append('g')
      .attr('class', 'legend')
      .attr('transform', 'translate(' + (width - 120) + ',0)')

    legend
      .selectAll('rect')
      .data(['male', 'female', 'both'])
      .enter()
      .append('rect')
      .attr('x', 0)
      .attr('y', (d, i) => i * 20)
      .attr('width', 18)
      .attr('height', 18)
      .attr('fill', color)

    legend
      .selectAll('text')
      .data(['Male', 'Female', 'Both Sexes'])
      .enter()
      .append('text')
      .attr('x', 24)
      .attr('y', (d, i) => i * 20 + 9)
      .attr('dy', '0.32em')
      .text((d) => d)
  }
}

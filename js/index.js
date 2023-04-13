const init = () => {
  const MORTALITY_RATE = '../assets/MDG_0000000007.csv'

  let mortalityRate = [],
    regions = []

  // set the dimensions and margins of the graph
  const margin = { top: 10, right: 30, bottom: 90, left: 40 },
    width = 460 - margin.left - margin.right,
    height = 450 - margin.top - margin.bottom

  // append the svg object to the body of the page
  const svg = d3
    .select('#bar_chart')
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  Promise.all([
    d3.csv(MORTALITY_RATE, function (data) {
      mortalityRate.push(data)
    }),
    d3.csv('./assets/codes/REGION.csv', function (d) {
      regions.push(d)
    }),
  ]).then(function (data) {
    barChart(mortalityRate)
  })

  const barChart = (rate) => {
    // filter the data for the year 2020
    const continentsMortalityRate = rate.filter(function (d) {
      return (
        d.SpatialDimension === 'REGION' &&
        d.TimeDim === '2020' &&
        d.DisaggregatingDimension1ValueCode === 'BTSX' &&
        d.SpatialDimensionValueCode !== 'GLOBAL'
      )
    })

    continentsMortalityRate.sort(function (a, b) {
      return d3.descending(+a.NumericValue, +b.NumericValue)
    })

    // Create a map of region codes to region names for faster lookup
    const regionMap = d3.group(regions, (d) => d.Code)

    // Match the SpatialDimensionValueCode of each country with the code of each region
    continentsMortalityRate.forEach((continent) => {
      const regionCode = continent.SpatialDimensionValueCode
      const regionName = regionMap.get(regionCode)[0].Title
      if (regionName) {
        continent.Region = regionName
      }
    })

    // X axis
    const x = d3
      .scaleBand()
      .range([0, width])
      .domain(continentsMortalityRate.map((d) => d.Region))
      .padding(0.2)
    svg
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')

    // Add Y axis
    const y = d3.scaleLinear().domain([0, 80]).range([height, 0])
    svg.append('g').call(d3.axisLeft(y))

    // Bars
    svg
      .selectAll('mybar')
      .data(continentsMortalityRate)
      .join('rect')
      .attr('x', (d) => x(d.Region))
      .attr('width', x.bandwidth())
      .attr('fill', '#69b3a2')
      // no bar at the beginning thus:
      .attr('height', (d) => height - y(0)) // always equal to 0
      .attr('y', (d) => y(0))
      .on('click', function (d) {
        distribution(d.srcElement.__data__.SpatialDimensionValueCode)
      })
      .on('mouseover', function () {
        d3.select(this).attr('fill', '#477e71')
        d3.select(this).style('cursor', 'pointer')
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#69b3a2')
      })

    // Animation
    svg
      .selectAll('rect')
      .transition()
      .duration(800)
      .attr('y', (d) => y(+d.NumericValue))
      .attr('height', (d) => height - y(+d.NumericValue))
      .delay((d, i) => {
        // console.log(i)
        return i * 100
      })
  }

  // Cause of death  and Disoveries from the dataset

  let causes = [],
    causesName = [],
    underFiveDeath = []

  Promise.all([
    d3.csv('../assets/MORT_300.csv', function (data) {
      // Distribution of causes of death among children aged < 5 years
      causes.push(data)
    }),
    d3.csv('../assets/codes/CHILDCAUSE.csv', function (data) {
      // Code for cause of death
      causesName.push(data)
    }),
    d3.csv('../assets/CM_01.csv', function (data) {
      // Regions and countries data set on Number of deaths among children under-five
      underFiveDeath.push(data)
    }),
  ]).then(function (data) {
    const nestedData = d3.group(causes, (d) => d.DisaggregatingDimension3ValueCode)
    const totals = Array.from(nestedData, ([cause, values]) => ({
      cause,
      totalDeaths: d3.sum(values, (d) => +d.Value),
    }))

    // Find the cause with the highest total death count
    const maxCause = d3.max(totals, (d) => d.totalDeaths)
    let highestCause = totals.find((d) => d.totalDeaths === maxCause)

    let name = causesName.find((d) => d.Code === highestCause.cause)
    document.querySelector('.cause').innerHTML = name.Title
    document.querySelector('.cause_value').innerHTML = 'Total ' + formatNumber(Math.round(maxCause)) // showing data in html

    // Under five Death
    let underFive = underFiveDeath.filter(function (d) {
      return d.SpatialDimensionValueCode === 'GLOBAL' && d.TimeDimensionValue === '2020'
    })
    document.querySelector('.under_five_deaths').innerHTML = formatNumber(underFive[0].NumericValue)

    const continentsNested = d3.group(underFiveDeath, (d) => d.SpatialDimension)
    let d = continentsNested.get('REGION').filter(function (d) {
      return (
        d.TimeDimensionValue === '2020' &&
        d.DisaggregatingDimension1ValueCode === 'BTSX' &&
        d.SpatialDimensionValueCode !== 'GLOBAL'
      )
    })

    const continentsTotal = Array.from(
      d3.group(d, (c) => c.SpatialDimensionValueCode),
      ([continent, values]) => ({
        continent,
        total: d3.sum(values, (v) => +v.NumericValue),
      })
    )
    const maxDeathContinent = d3.max(continentsTotal, (d) => d.total)

    document.querySelector('.continent_death').innerHTML = formatNumber(maxDeathContinent)
  })

  // d3.csv('../assets/MORT_300.csv', function (data) {
  //   causes.push(data)
  // }).then(function (d) {})
}

document.addEventListener("DOMContentLoaded", () => {
  // Set current year in footer
  document.getElementById("current-year").textContent = new Date().getFullYear()

  // Global state
  const state = {
    bmiValue: null,
    userHeight: null,
    userWeight: null,
    currentCategory: null,
  }

  // DOM Elements
  const heightInput = document.getElementById("height")
  const weightInput = document.getElementById("weight")
  const calculateBtn = document.getElementById("calculate-btn")
  const resultContainer = document.getElementById("result-container")
  const bmiValueElement = document.getElementById("bmi-value")
  const bmiClassificationElement = document.getElementById("bmi-classification")
  const tabTriggers = document.querySelectorAll(".tab-trigger")
  const tabContents = document.querySelectorAll(".tab-content")
  const goalsPlaceholder = document.getElementById("goals-placeholder")
  const goalsTable = document.getElementById("goals-table")
  const goalsTableBody = document.getElementById("goals-table-body")
  const categoryRows = document.querySelectorAll(".category-row")
  const bmiChart = document.getElementById("bmi-chart")

  // Initialize tabs
  tabTriggers.forEach((trigger) => {
    trigger.addEventListener("click", () => {
      // Remove active class from all triggers and contents
      tabTriggers.forEach((t) => t.classList.remove("active"))
      tabContents.forEach((c) => c.classList.remove("active"))

      // Add active class to clicked trigger and corresponding content
      trigger.classList.add("active")
      const tabId = trigger.getAttribute("data-tab")
      document.getElementById(`${tabId}-tab`).classList.add("active")

      // Redraw chart if chart tab is active
      if (tabId === "chart") {
        drawBmiChart()
      }
    })
  })

  // Calculate BMI function
  function calculateBMI() {
    const height = Number.parseFloat(heightInput.value)
    const weight = Number.parseFloat(weightInput.value)

    if (!height || !weight || height <= 0 || weight <= 0) {
      alert("Por favor, insira valores válidos para altura e peso.")
      return
    }

    const heightInMeters = height / 100
    const bmi = weight / (heightInMeters * heightInMeters)
    const bmiRounded = Number.parseFloat(bmi.toFixed(2))

    // Update state
    state.bmiValue = bmiRounded
    state.userHeight = height
    state.userWeight = weight

    // Display result
    bmiValueElement.textContent = bmiRounded
    resultContainer.classList.remove("hidden")

    // Determine classification
    let classification, classColor

    if (bmi < 18.5) {
      classification = "Abaixo do peso"
      classColor = "text-blue-600"
      state.currentCategory = 0
    } else if (bmi < 25) {
      classification = "Peso normal"
      classColor = "text-green-600"
      state.currentCategory = 1
    } else if (bmi < 30) {
      classification = "Sobrepeso"
      classColor = "text-yellow-600"
      state.currentCategory = 2
    } else if (bmi < 35) {
      classification = "Obesidade grau 1"
      classColor = "text-orange-600"
      state.currentCategory = 3
    } else if (bmi < 40) {
      classification = "Obesidade grau 2"
      classColor = "text-red-600"
      state.currentCategory = 4
    } else {
      classification = "Obesidade grau 3"
      classColor = "text-red-700"
      state.currentCategory = 5
    }

    bmiClassificationElement.textContent = classification
    bmiClassificationElement.className = "classification-value " + classColor

    // Highlight the corresponding row in the table
    highlightTableRow()

    // Update goals table
    updateGoalsTable()

    // Redraw chart
    drawBmiChart()
  }

  // Event listeners
  calculateBtn.addEventListener("click", calculateBMI)

  // Also calculate when inputs change (after a short delay)
  let debounceTimer
  function debounceCalculate() {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(calculateBMI, 500)
  }

  // Highlight the corresponding row in the BMI table
  function highlightTableRow() {
    // Remove all highlights first
    categoryRows.forEach((row) => {
      row.className = "category-row"
    })

    // Add highlight to current category
    if (state.currentCategory !== null) {
      const categoryColors = [
        "highlight-blue",
        "highlight-green",
        "highlight-yellow",
        "highlight-orange",
        "highlight-red",
        "highlight-darkred",
      ]

      const currentRow = document.querySelector(`.category-row[data-category="${state.currentCategory}"]`)
      if (currentRow) {
        currentRow.classList.add(categoryColors[state.currentCategory])
      }
    }
  }

  // Update goals table
  function updateGoalsTable() {
    if (!state.bmiValue || !state.userHeight || !state.userWeight) {
      goalsPlaceholder.classList.remove("hidden")
      goalsTable.classList.add("hidden")
      return
    }

    goalsPlaceholder.classList.add("hidden")
    goalsTable.classList.remove("hidden")

    // Clear existing rows
    goalsTableBody.innerHTML = ""

    const heightInMeters = state.userHeight / 100
    const currentCategory = state.currentCategory
    const calculatedGoals = []

    // BMI thresholds
    const thresholds = [18.5, 25, 30, 35, 40]

    // Add current category
    calculatedGoals.push({
      target: state.bmiValue.toFixed(1),
      category: getCategoryName(currentCategory),
      targetWeight: state.userWeight,
      difference: 0,
      isCurrent: true,
    })

    // Add previous category if exists
    if (currentCategory > 0) {
      const prevThreshold = thresholds[currentCategory - 1]
      const targetWeight = Number.parseFloat((prevThreshold * heightInMeters * heightInMeters).toFixed(1))
      const difference = Number.parseFloat((targetWeight - state.userWeight).toFixed(1))

      calculatedGoals.push({
        target: prevThreshold.toString(),
        category: getCategoryName(currentCategory - 1),
        targetWeight,
        difference,
        isCurrent: false,
      })
    }

    // Add next category if exists
    if (currentCategory < 5) {
      const nextThreshold = thresholds[currentCategory]
      const targetWeight = Number.parseFloat((nextThreshold * heightInMeters * heightInMeters).toFixed(1))
      const difference = Number.parseFloat((targetWeight - state.userWeight).toFixed(1))

      calculatedGoals.push({
        target: nextThreshold.toString(),
        category: getCategoryName(currentCategory + 1),
        targetWeight,
        difference,
        isCurrent: false,
      })
    }

    // Render goals
    calculatedGoals.forEach((goal) => {
      const row = document.createElement("tr")
      row.className = goal.isCurrent ? "highlight" : ""

      // Target BMI
      const targetCell = document.createElement("td")
      targetCell.textContent = goal.target
      row.appendChild(targetCell)

      // Category
      const categoryCell = document.createElement("td")
      if (goal.isCurrent) {
        const currentIndicator = document.createElement("span")
        currentIndicator.className = "current-indicator"

        const dot = document.createElement("span")
        dot.className = "current-dot"

        currentIndicator.appendChild(dot)
        currentIndicator.appendChild(document.createTextNode(`${goal.category} (atual)`))
        categoryCell.appendChild(currentIndicator)
      } else {
        categoryCell.textContent = goal.category
      }
      row.appendChild(categoryCell)

      // Target weight
      const weightCell = document.createElement("td")
      weightCell.textContent = `${goal.targetWeight} kg`
      row.appendChild(weightCell)

      // Difference
      const diffCell = document.createElement("td")
      if (goal.isCurrent) {
        diffCell.innerHTML = '<span style="color: #9333ea;">—</span>'
      } else if (goal.difference < 0) {
        const trendIndicator = document.createElement("div")
        trendIndicator.className = "trend-indicator"

        const icon = document.createElement("span")
        icon.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trend-down"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"></polyline><polyline points="17 18 23 18 23 12"></polyline></svg>'

        trendIndicator.appendChild(icon)
        trendIndicator.appendChild(document.createTextNode(`-${Math.abs(goal.difference)} kg`))
        diffCell.appendChild(trendIndicator)
      } else {
        const trendIndicator = document.createElement("div")
        trendIndicator.className = "trend-indicator"

        const icon = document.createElement("span")
        icon.innerHTML =
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="trend-up"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>'

        trendIndicator.appendChild(icon)
        trendIndicator.appendChild(document.createTextNode(`+${Math.abs(goal.difference)} kg`))
        diffCell.appendChild(trendIndicator)
      }
      row.appendChild(diffCell)

      goalsTableBody.appendChild(row)
    })
  }

  // Get category name by index
  function getCategoryName(index) {
    const categories = [
      "Abaixo do peso",
      "Peso normal",
      "Sobrepeso",
      "Obesidade grau 1",
      "Obesidade grau 2",
      "Obesidade grau 3",
    ]
    return categories[index]
  }

  // Draw BMI Chart
  function drawBmiChart() {
    const canvas = bmiChart
    const ctx = canvas.getContext("2d")

    // Set canvas dimensions based on device pixel ratio for sharper rendering
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height)

    // Set dimensions
    const width = rect.width
    const height = rect.height
    const padding = width < 400 ? 30 : 40
    const chartWidth = width - padding * 2
    const chartHeight = height - padding * 2

    // Draw background with gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
    bgGradient.addColorStop(0, "rgba(250, 250, 255, 0.9)")
    bgGradient.addColorStop(1, "rgba(245, 240, 255, 0.9)")
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Draw chart background with subtle gradient
    const chartGradient = ctx.createLinearGradient(padding, padding, padding, padding + chartHeight)
    chartGradient.addColorStop(0, "rgba(250, 245, 255, 0.9)")
    chartGradient.addColorStop(1, "rgba(245, 240, 255, 0.9)")
    ctx.fillStyle = chartGradient
    ctx.fillRect(padding, padding, chartWidth, chartHeight)

    // Add subtle grid lines
    ctx.strokeStyle = "rgba(150, 150, 150, 0.2)"
    ctx.lineWidth = 1

    // Vertical grid lines
    for (let i = 1; i < 5; i++) {
      const x = padding + (chartWidth / 5) * i
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, padding + chartHeight)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let i = 1; i < 3; i++) {
      const y = padding + (chartHeight / 3) * i
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(padding + chartWidth, y)
      ctx.stroke()
    }

    // BMI ranges and colors with gradients
    const ranges = [
      { max: 18.5, color: "#3b82f6", gradient: ctx.createLinearGradient(0, 0, 0, chartHeight) }, // Abaixo do peso - blue
      { max: 25, color: "#22c55e", gradient: ctx.createLinearGradient(0, 0, 0, chartHeight) }, // Peso normal - green
      { max: 30, color: "#eab308", gradient: ctx.createLinearGradient(0, 0, 0, chartHeight) }, // Sobrepeso - yellow
      { max: 35, color: "#f97316", gradient: ctx.createLinearGradient(0, 0, 0, chartHeight) }, // Obesidade grau 1 - orange
      { max: 40, color: "#ef4444", gradient: ctx.createLinearGradient(0, 0, 0, chartHeight) }, // Obesidade grau 2 - red
      { max: 50, color: "#b91c1c", gradient: ctx.createLinearGradient(0, 0, 0, chartHeight) }, // Obesidade grau 3 - dark red
    ]

    // Set up gradients with higher opacity for better visibility
    ranges.forEach((range) => {
      range.gradient.addColorStop(0, range.color + "AA") // 67% opacity
      range.gradient.addColorStop(1, range.color + "88") // 53% opacity
    })

    // Draw BMI ranges
    const minBMI = 15
    const maxBMI = 50
    const bmiRange = maxBMI - minBMI

    let startX = padding

    ranges.forEach((range, index) => {
      const rangeStart = index === 0 ? minBMI : ranges[index - 1].max
      const rangeWidth = ((range.max - rangeStart) / bmiRange) * chartWidth

      // Draw range rectangle with gradient
      ctx.fillStyle = range.gradient
      ctx.fillRect(startX, padding, rangeWidth, chartHeight)

      // Add border to range
      ctx.strokeStyle = range.color
      ctx.lineWidth = 1
      ctx.strokeRect(startX, padding, rangeWidth, chartHeight)

      // Draw range label
      ctx.fillStyle = "#333333"
      ctx.font = width < 400 ? "10px Arial" : "12px Arial"
      ctx.textAlign = "center"
      ctx.fillText(range.max.toString(), startX + rangeWidth, padding + chartHeight + 15)

      startX += rangeWidth
    })

    // Draw labels
    ctx.fillStyle = "#333333"
    ctx.font = width < 400 ? "12px Arial" : "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("Índice de Massa Corporal (IMC)", width / 2, padding / 2)

    // Draw categories
    const categories = [
      "Abaixo do peso",
      "Peso normal",
      "Sobrepeso",
      "Obesidade grau 1",
      "Obesidade grau 2",
      "Obesidade grau 3",
    ]

    startX = padding

    categories.forEach((category, index) => {
      const rangeStart = index === 0 ? minBMI : ranges[index - 1].max
      const rangeWidth = ((ranges[index].max - rangeStart) / bmiRange) * chartWidth

      ctx.fillStyle = "#333333"
      ctx.font = width < 400 ? "8px Arial" : "10px Arial"
      ctx.textAlign = "center"

      // Adjust text position for mobile
      if (width < 400) {
        // For mobile, display text at an angle for better fit
        ctx.save()
        ctx.translate(startX + rangeWidth / 2, padding + chartHeight - 15)
        ctx.rotate(-Math.PI / 6) // Rotate text slightly
        ctx.fillText(category, 0, 0)
        ctx.restore()
      } else {
        ctx.fillText(category, startX + rangeWidth / 2, padding + chartHeight - 10)
      }

      startX += rangeWidth
    })

    // Draw user's BMI marker if available
    if (state.bmiValue) {
      let markerX = padding + ((state.bmiValue - minBMI) / bmiRange) * chartWidth
      markerX = Math.max(padding, Math.min(padding + chartWidth, markerX))


      // Draw vertical line with gradient
      const lineGradient = ctx.createLinearGradient(0, padding, 0, padding + chartHeight)
      lineGradient.addColorStop(0, "rgba(100, 50, 200, 0.9)")
      lineGradient.addColorStop(1, "rgba(100, 50, 200, 0.5)")

      ctx.beginPath()
      ctx.moveTo(markerX, padding)
      ctx.lineTo(markerX, padding + chartHeight)
      ctx.strokeStyle = lineGradient
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw glow effect
      ctx.beginPath()
      const glow = ctx.createRadialGradient(markerX, padding - 10, 0, markerX, padding - 10, 16)
      glow.addColorStop(0, "rgba(128, 55, 220, 0.8)")
      glow.addColorStop(1, "rgba(128, 55, 220, 0)")
      ctx.fillStyle = glow
      ctx.arc(markerX, padding - 10, 16, 0, Math.PI * 2)
      ctx.fill()

      // Draw marker
      ctx.beginPath()
      ctx.arc(markerX, padding - 10, 8, 0, Math.PI * 2)
      ctx.fillStyle = "#8035dc" // purple
      ctx.fill()
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2
      ctx.stroke()
    }
  }

  // Initial chart drawing
  drawBmiChart()

  // Handle window resize for responsive chart
  window.addEventListener("resize", drawBmiChart)
})


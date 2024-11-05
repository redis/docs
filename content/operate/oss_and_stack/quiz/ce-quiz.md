---
title: Docs recommendation form
description: Get a customized list of the docs you should read for your use case.
linkTitle: Doc recommendation
---

# Find the docs you need to get started

Welcome! Answer the questions below to find the docs that best fit your needs.

<div id="recommendationForm">
  <form id="productForm">
    <div class="question">
      <p>1. What is your main purpose for using the documentation?</p>
      <label><input type="radio" name="purpose" value="a"> Casual use</label><br>
      <label><input type="radio" name="purpose" value="b"> Professional work</label><br>
      <label><input type="radio" name="purpose" value="c"> Learning</label><br>
    </div>

    <div class="question">
      <p>2. What is your operating system?</p>
      <label><input type="radio" name="budget" value="a"> Linux</label><br>
      <label><input type="radio" name="budget" value="b"> macOS</label><br>
      <label><input type="radio" name="budget" value="c"> Windows</label><br>
    </div>

    <div class="question">
      <p>3. Which feature is most important to you?</p>
      <label><input type="radio" name="feature" value="a"> Search</label><br>
      <label><input type="radio" name="feature" value="b"> JSON</label><br>
      <label><input type="radio" name="feature" value="c"> Time series</label><br>
    </div>

    <button type="button" onclick="recommendProduct()">Get Recommendation</button>
  </form>
  <div id="recommendationResult"></div>
</div>

<script>
function recommendProduct() {
  const purpose = document.querySelector('input[name="purpose"]:checked');
  const budget = document.querySelector('input[name="budget"]:checked');
  const feature = document.querySelector('input[name="feature"]:checked');

  if (!purpose || !budget || !feature) {
    alert("Please answer all questions!");
    return;
  }

  let recommendation = "";

  if (purpose.value === 'a' && budget.value === 'a') {
    recommendation = "Product A - Perfect for casual use within your budget!";
  } else if (purpose.value === 'b' && feature.value === 'b') {
    recommendation = "Product B - Ideal for professional work with great processing power!";
  } else if (purpose.value === 'c' && feature.value === 'c') {
    recommendation = "Product C - Great for gaming with an amazing display!";
  } else {
    recommendation = "Product D - A versatile choice that meets most needs.";
  }

  document.getElementById("recommendationResult").innerHTML = `<p>We recommend: <strong>${recommendation}</strong></p>`;
}
</script>

<style>
#recommendationForm {
  margin: 20px;
}

.question {
  margin-bottom: 15px;
}

#recommendationResult p {
  font-weight: bold;
  color: #0056b3;
}
</style>

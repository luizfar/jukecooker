// The original step definitions, extracted from the step definition files.
// Each element in the array is an array whose first element is the regular expression
// and the next element is an (optional) array containing the parameters given in the do block.
// originalSteps = [#{steps}];

// The expanded steps (splitted by ors or optional regexps).
// Each element in the array is a hash with the following properties:
//   regexp: the regular expression to deal with
//   params: an array of parameters that were given in the do block
//   regexpReplaced: the regular expression with groups replaced with params
var steps = [];

// The index of the selected step.
var selectedStepIndex = 0;

// The indices of the li's that are shown.
var liIndices = [];

// The selected step once the user pressed enter.
var buildingStep = null;

// The current action entered by the user
var currentAction = "Given ";

// The last action entered by the user
var lastAction = '';

// Is the current action different than the last action?
var lastActionChanged = false;

// The text that was in #stepMatch before a keyup event was fired
var lastStepMatchText = '';

// Is the user creating the first step in the scenario?
var firstStepInScenario = true;

var allLiIndices = [];

// HACK: keyup event if fired twice... why? :'-(
var justBuiltAStep = false;

var delay = (function() {
  var timer = 0;
  return function(callback, ms) {
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

$(function() {
  $steps = $("#steps");
  $stepBuilder = $("#stepBuilder");
  $scenario = $("#scenario");
  $stepMatch = $("#stepMatch");
  $stepMatch_static = $("#stepMatch_static");
  $explanationStep = $("#explanationStep");
  $explanationStepBuilder = $("#explanationStepBuilder");

  // Push all elements into array
  function pushAll(array, elements) {
    for(var i = 0; i < elements.length; i++)
      array.push(elements[i]);
  }

  // Split the regexp into their expansions.
  // For example:
  //   "(?:a|b) c"        --> ["a c", "b c"]
  //   "(?:a )?b"         --> ["a b", "b"]
  //   "(?:a )?(?:b|c) d" --> ["a b d", "a c d", "b d", "c d"]
  function splitRegexp(regexp) {
    var results = [];

    // Find an OR expression
    var match = regexp.match(/\(\?\:.*?\|.*?\)/);
    if (match) {
      match = match[0];
      var idx = regexp.indexOf(match);
      // Remove (?: ... )
      match = match.substring(3, match.length - 1);
      var pieces = match.split("\|");
      for(var i = 0; i < pieces.length; i++) {
        var before = regexp.substring(0, idx);
        var after = regexp.substring(idx + match.length + 4);
        var newRegexp = before + pieces[i] + after;
        pushAll(results, splitRegexp(newRegexp));
      }
      return results;
    }

    // Find optional expression with parenthesis
    match = regexp.match(/\(\?\:.*?\)\?/);
    if (match) {
      match = match[0];
      var idx = regexp.indexOf(match);
      var before = regexp.substring(0, idx);
      var after = regexp.substring(idx + match.length);
      // This is without the surrounding (?: ... )?
      var middle = match.substring(3, match.length - 2);
      var regexpWithout = before + after;
      var regexpWith = before + middle + after;
      pushAll(results, splitRegexp(regexpWithout));
      pushAll(results, splitRegexp(regexpWith));
      return results;
    }

    // Find optional expression without parenthesis
    match = regexp.match(/.\?/);
    if (match) {
      match = match[0];
      var idx = regexp.indexOf(match);
      var before = regexp.substring(0, idx);
      var after = regexp.substring(idx + match.length);
      // This is without the ?
      var middle = match.substring(0, match.length - 1);
      var regexpWithout = before + after;
      var regexpWith = before + middle + after;
      pushAll(results, splitRegexp(regexpWithout));
      pushAll(results, splitRegexp(regexpWith));
      return results;
    }

    // Replace \/ with /
    while(regexp.indexOf("\\\\/") >= 0) {
      regexp = regexp.replace(/\\\//, "/");
    }

    return [regexp];
  }

  // Processes each group in the step regexp with the given callback. The callback
  // receives the index of the matched group and must return a replacement
  // for it.
  function processGroups(step, callback) {
    paramIdx = 0;
    regexp = step.regexp;
    var matches = true;
    while (matches) {
      matches = regexp.match(/\$.+?\$/);
      if (matches) {
        var m = matches[0];
        idx = regexp.indexOf(m);
        regexp = regexp.substring(0, idx) + callback(paramIdx) + regexp.substring(idx + m.length);
        paramIdx++;
      }
    }
    return regexp;
  }

  // Transforms 'foo "(...)" bar' into 'foo (...) bar'
  function removeQuotedGroups(step) {
    regexp = step.regexp;
    while(true) {
      m = regexp.match(/"\(.+?\)"/);
      if (!m) break;

      m = m[0];
      idx = regexp.indexOf(m);
      regexp = regexp.substring(0, idx) + m.substring(1, m.length -1) + regexp.substring(idx + m.length);
    }
    return regexp;
  }

  // Appends the step just built to the scenario div.
  function appendToScenario() {
      replacement = processGroups(buildingStep, function(idx) {
        return '<span class="param">' + $("#p" + idx).val() + '</span>';
      });
      replacement = "<strong>" + currentAction + "</strong>" + replacement;
      if (currentAction == "And ") {
        replacement = "&nbsp;&nbsp;" + replacement;
      } else if (lastActionChanged && !firstStepInScenario) {
        replacement = "<br/>" + replacement;
      }
      regexp = buildingStep.regexp;
      if (regexp[regexp.length - 1] == ':') {
        if (currentAction == "And ") {
          replacement += '<br/>&nbsp;&nbsp;"""<br/>&nbsp;&nbsp;TODO: text or table goes here&nbsp;&nbsp;<br/>&nbsp;&nbsp;"""';
        } else {
          replacement += '<br/>"""<br/>TODO: text or table goes here<br/>"""';
        }
      }
      firstStepInScenario = false;
      justBuiltAStep = true;
      $scenario.append(replacement + "<br/>");
  }

  // Prepares the page for building steps (input texts for parameters)
  function prepareBuildStep() {
    buildingStep = steps[currentLiIndex()];

    // Set the current action and see if it changed from the last one
    if (lastAction == currentAction && currentAction != "And ") {
      currentAction = "And ";
      lastActionChanged = false;
    } else {
      lastActionChanged = true;
    }
    lastAction = currentAction;

    groupsCount = 0;
    processGroups(buildingStep, function(idx) {
      groupsCount++;
      return '';
    });

    if (groupsCount == 0) {
      appendToScenario();
      searchAgain();
    } else {
      $explanationStep.hide();
      $explanationStepBuilder.show();
      $stepMatch.attr('readonly', 'readonly');
      $stepMatch.val(currentAction + buildingStep.regexpReplaced);
      $steps.hide();
      $stepBuilder.show();

      regexpWithoutQuotes = removeQuotedGroups(buildingStep);
      originalRegexp = buildingStep.regexp;
      buildingStep.regexp = regexpWithoutQuotes;

      html = '<table><tr><td><nobr><strong>' + currentAction + "</strong>";
      html += processGroups(buildingStep, function(idx) {
        return '</nobr></td><td width="100"><input type="text" id="p' + idx + '" class="complete"></td><td><nobr>';
      });
      html += '</td></tr><tr align="center"><td>';
      for(var i = 0; i < groupsCount; i++) {
        html += '</td><td class="param">' + buildingStep.params[i] + "</td><td>";
      }
      html += "</td></tr></table>";
      $stepBuilder.html(html);

      $("#p0").focus();

      buildingStep.regexp = originalRegexp;
    }
  }

  // Resets everything except the scenario div to search a new step.
  function searchAgain() {
    selectedStepIndex = 0;
    liIndices = allLiIndices;
    $explanationStep.show();
    $explanationStepBuilder.hide();
    $stepMatch.attr('readonly', '');
    $steps.show();
    $stepBuilder.hide();
    $stepsLi.show();
    $stepsLi.removeClass("selected");
    stepLi(0).addClass("selected");
    $stepMatch.val("");
    $stepMatch.focus();
    $steps.scrollTop(0);
  }

  // Returns the index of the currently selected <li>
  function currentLiIndex() {
    return liIndices[selectedStepIndex];
  }

  // Returns the selected <li> as a jQuery object
  function currentLi() {
    return $($stepsLi[currentLiIndex()]);
  }

  // Returns a step <li> as a jQuery object
  function stepLi(idx) {
    return $($stepsLi[idx]);
  }

  // Event handler to match steps when text is entered
  function matchStep(ev) {
    if (justBuiltAStep) {
      justBuiltAStep = false;
      return;
    }

    var text = $stepMatch.val();

    // If the text didn't change and it's not enter, do nothing
    if (text == lastStepMatchText && ev.keyCode != 13)
      return true;

    // These are the arrow keys, home, end, etc. We can ignore them.
    if (ev.keyCode >= 33 && ev.keyCode <= 40) {
      return true;
    }

    lastStepMatchText = text;

    // If the user pressed enter, selected the step
    if (ev.keyCode == 13) {
      prepareBuildStep();
      return false;
    }

    // Unselect the current step
    currentLi().removeClass("selected");

    // See if we the text starts with an action and remove it
    foundMatch = false;
    if (text.match(/^w$|wh$|whe$|when/i)) {
      text = text.substring(5);
      currentAction = "When ";
    }
    else if (text.match(/^t$|th$|the$|then/i)) {
      text = text.substring(5);
      currentAction = "Then ";
    }
    else if (text.match(/^g$|gi$|giv$|give$|given/i)) {
      text = text.substring(6);
      currentAction = "Given ";
    }
    else if (text.match(/^a$|an$|and/i)) {
      text = text.substring(4);
      currentAction = "And ";
    }

    // Do the filtering
    text = eval("/^" + text + "/i");
    liIndices = [];

    selectedStepIndex = -1;
    for(var i = 0; i < steps.length; i++) {
      step = steps[i];
      $stepLi = stepLi(i);
      if (step.regexpReplaced.match(text)) {
        $stepLi.show();
        if (selectedStepIndex == -1) {
          $stepLi.addClass("selected");
          selectedStepIndex = 0;
        }
        liIndices.push(i);
      } else {
        $stepLi.hide();
      }
    }
  }

  // Split original steps and create the steps array
  for(var i = 0; i < originalSteps.length; i++) {
    var originalStep = originalSteps[i];
    var step = originalStep[0].toString();
    var splits = splitRegexp(step);
    for(var j = 0; j < splits.length; j++) {
      var split = splits[j];

      var newStep = {}
      newStep.regexp = split
      newStep.params = originalStep.length == 1 ? [] : originalStep[1]
      newStep.regexpReplaced = processGroups(newStep, function(idx) {
        return newStep.params[idx];
      });

      steps.push(newStep);

      allLiIndices.push(allLiIndices.length);
    }
  }

  liIndices = allLiIndices;

  // Sort steps according to regexps, alphabetically
  steps.sort(function(a, b) {
    var x = a.regexp.toLowerCase();
    var y = b.regexp.toLowerCase();
    return x < y ? -1 : (x > y ? 1 : 0);
  });

  // Write the steps in the <li>s
  for(var i = 0; i < steps.length; i++) {
    step = steps[i];
    replacement = processGroups(step, function(idx) {
      return '<span class="param">' + step.params[idx] + '</span>';
    });
    $steps.append("<li>" + replacement + "</li>");
  }

  $stepsLi = $steps.find("li");

  // Highlight the first selected step
  stepLi(0).addClass("selected");

  // Focus the text input to write the match
  $stepMatch.focus();

  // When pressing a key in the step match input, filter the steps
  $stepMatch.keyup(function(ev) {
    delay(function() {
      matchStep(ev);
    }, 100 );
  });

  // When pressing up or down on the stepMatch input,
  // change the selected step
  $stepMatch.keydown(function(ev) {
    if (selectedStepIndex == -1) return;

    // Up, Down, PageUp or PageDown
    if (ev.keyCode == 38 || ev.keyCode == 40 || ev.keyCode == 33 || ev.keyCode == 34) {
      currentLi().removeClass("selected");

      var increment = 0;
      switch(ev.keyCode) {
        case 33: increment = -10; break;
        case 34: increment =  10; break;
        case 38: increment = -1; break;
        case 40: increment =  1; break;
      }

      selectedStepIndex += increment;

      if (selectedStepIndex < 0) selectedStepIndex = 0;
      if (selectedStepIndex > liIndices.length - 1) selectedStepIndex = liIndices.length - 1;

      current = currentLi();
      current.addClass("selected");
      $steps.scrollTop(0);
      $steps.scrollTop(current.position().top - 90);
      return false;
    }

    return true;
  });

  // When hovering an <li>, highglight it
  $stepsLi.mouseenter(function(ev) {
    currentLi().removeClass("selected");
    selectedStepIndex = $stepsLi.index(this);
    for(var i = 0; i < liIndices.length; i++) {
      if (selectedStepIndex == liIndices[i]) {
        selectedStepIndex = i;
        break;
      }
    }
    currentLi().addClass("selected");
  });

  // When clicking an <li>, build it
  $stepsLi.click(function(ev) {
    prepareBuildStep();
  });

  // When pressing enter or tab in the step building inputs, go
  // to the next one or write to scenario if it's the last one
  $(".complete").live("keyup", function(ev) {
    // When pressing ESC, go back to search
    if (ev.keyCode == 27) {
      searchAgain();
      return false;
    }

    // Enter
    if (ev.keyCode == 13) {
      $this = $(this);
      value = $this.val();
      if (value == '')
        return false;

      id = $this.attr("id").substring(1);
      id = parseInt(id) + 1;
      $next = $("#p" + id);
      if ($next.length > 0) {
        $next.focus();
      } else {
        appendToScenario();
        searchAgain();
      }
      return false;
    }
    return true;
  });

  // Clear the scenario
  $("#clear").click(function() {
    $scenario.html("");
    searchAgain();
    firstStepInScenario = true;
    currentAction = "Given ";
  });
});
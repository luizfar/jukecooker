package com.tests;

import org.jbehave.core.annotations.Given;
import org.jbehave.core.annotations.Then;
import org.jbehave.core.annotations.When;

public class MySteps {

	@Given("I want to see my steps on the web")
	public void given() {

	}

	@When("I go to the web page mentioned on the given step")
	public void when() {

	}

	@Then("I will see the steps on the web as mentioned on given and when steps")
	public void then() {

	}

	@Then("I will see $something on the web")
	public void then(String something) {

	}
}

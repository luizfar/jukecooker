package com.tests;

import org.jbehave.core.annotations.Given;
import org.jbehave.core.annotations.Then;
import org.jbehave.core.annotations.When;

public class MySteps {

	@Given("I want to see my steps on the web")
	public void given() {

	}

    @Given("My surname is $name and I have a 'cat'")
    public void givenMyNameIs(String name) {

    }

	@When("I go to the web page mentioned on the given step")
	public void when() {

	}

	@Then("I will see the steps on the web as mentioned on given and when steps")
	public void then() {

	}

	@Given("I want to see other steps on the web")
	public void given2() {

	}

	@When("I go to another web page mentioned on some of the given steps")
	public void when2() {

	}

	@Then("I will see some step defined somewhere")
	public void then2() {

	}
}

package com.tests;

import org.jbehave.core.junit.JUnitStories;
import org.jbehave.core.steps.CandidateSteps;
import org.jbehave.core.steps.InstanceStepsFactory;

import java.util.List;

public class MyStories extends JUnitStories {

	@Override
	public List<CandidateSteps> candidateSteps() {
		return new InstanceStepsFactory(configuration(), new MySteps()).createCandidateSteps();
	}

	@Override
	protected List<String> storyPaths() {
		return null;  //To change body of implemented methods use File | Settings | File Templates.
	}
}

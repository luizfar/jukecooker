package com.thoughtworks;

import org.jbehave.core.ConfigurableEmbedder;
import org.jbehave.core.steps.CandidateSteps;
import org.jbehave.core.steps.StepCandidate;

import java.util.ArrayList;
import java.util.List;

public class StepsFinder {

	public List<String> findByJBehaveConfiguration(Class<? extends ConfigurableEmbedder> clazz) {
		List<String> steps = new ArrayList<String>();

        ConfigurableEmbedder configurableEmbedder;
        try {
            configurableEmbedder = clazz.newInstance();
        } catch (InstantiationException e) {
            throw new RuntimeException(e);
        } catch (IllegalAccessException e) {
            throw new RuntimeException(e);
        }

        List<CandidateSteps> stepsList = configurableEmbedder.candidateSteps();
		for (CandidateSteps candidateSteps : stepsList) {
			for (StepCandidate candidate : candidateSteps.listCandidates()) {
                String stepText = candidate.toString().replaceFirst("GIVEN ", "").replaceFirst("WHEN ", "").replaceFirst("THEN ", "");
                steps.add(stepText);
			}
		}

		return steps;
	}
}

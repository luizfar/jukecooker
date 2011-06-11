package com.thoughtworks;

import com.tests.MyStories;
import org.jbehave.core.junit.JUnitStories;
import org.jbehave.core.steps.CandidateSteps;
import org.jbehave.core.steps.StepCandidate;

import java.io.*;
import java.util.ArrayList;
import java.util.List;

public class StepsFinder {

	public List<String> findAll(Class<? extends JUnitStories> clazz) throws IllegalAccessException, InstantiationException {
		List<String> steps = new ArrayList<String>();

		JUnitStories stories = clazz.newInstance();
		List<CandidateSteps> stepsList = stories.candidateSteps();
		for (CandidateSteps candidateSteps : stepsList) {
			for (StepCandidate candidate : candidateSteps.listCandidates()) {
                String stepText = candidate.toString().replaceFirst("GIVEN ", "").replaceFirst("WHEN ", "").replaceFirst("THEN ", "");
                System.out.println(stepText);
                steps.add(stepText);
			}
		}

		return steps;
	}

	private String format(List<String> stepList) {
		StringBuilder builder = new StringBuilder();
		for (String step : stepList) {
            builder.append("[\"");
            builder.append(step);
            builder.append("\"],\n");
        }

		return builder.toString();
	}

    private String generateHTML(List<String> stepList, String htmlTemplateFile) throws IOException {
		StringBuilder htmlBuilder = new StringBuilder();
        String line;

        BufferedReader reader = new BufferedReader(new FileReader(htmlTemplateFile));
        while ((line = reader.readLine()) != null) {
            htmlBuilder.append(line);
            htmlBuilder.append("\n");
        }

        String html = htmlBuilder.toString();
        html = html.replace("#{steps}", format(stepList));

        return html;
	}

	public static void main(String[] args) throws InstantiationException, IllegalAccessException, IOException {
        StepsFinder stepsFinder = new StepsFinder();
		List<String> stepList = stepsFinder.findAll(MyStories.class);
		String html = stepsFinder.generateHTML(stepList, "./rsc/outputTemplate.html");

		FileWriter writer = new FileWriter(new File("./target/stories.html"));
		writer.write(html);
		writer.close();

        Runtime.getRuntime().exec("cp ./rsc/cukecooker.js ./target/");
	}
}

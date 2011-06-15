package com.thoughtworks;

import com.thoughtworks.exception.NoSourceFilesFoundException;
import org.jbehave.core.ConfigurableEmbedder;
import org.jbehave.core.steps.CandidateSteps;
import org.jbehave.core.steps.StepCandidate;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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
                String stepText = candidate.toString().replaceFirst("GIVEN", "Given").replaceFirst("WHEN", "When").replaceFirst("THEN", "Then");
                steps.add(stepText);
			}
		}

		return steps;
	}

	public List<String> findBySourceFiles(File sourceFilesParent) {
        List<File> javaFiles = listJavaFilesIn(sourceFilesParent);
        if (javaFiles == null || javaFiles.isEmpty()) {
            throw new NoSourceFilesFoundException();
        }

        try {
            return findStepsInFiles(javaFiles);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
	}

    private List<File> listJavaFilesIn(File parentDirectory) {
        List<File> javaFiles = asList(parentDirectory.listFiles(thatAreJavaSource()));
        File[] directories = parentDirectory.listFiles(thatAreDirectories());
        if (directories != null) {
            for (File directory : directories) {
                javaFiles.addAll(listJavaFilesIn(directory));
            }
        }
        return javaFiles;
    }

    private List<String> findStepsInFiles(List<File> javaFiles) throws IOException {
        ArrayList<String> steps = new ArrayList<String>();
        Pattern stepPattern = Pattern.compile("^\\s*@(Given|When|Then|Alias)\\(\"(.*?)\"\\)\\s*$");
        String lastStepType = "";

        for (File srcFile : javaFiles) {
            BufferedReader reader = new BufferedReader(new FileReader(srcFile));
            String line;
            while ((line = reader.readLine()) != null) {
                Matcher matcher = stepPattern.matcher(line);
                if (matcher.matches()) {
                    String stepType = matcher.group(1);
                    boolean isAlias = stepType.trim().equalsIgnoreCase("alias");
                    if (isAlias && !lastStepType.equals("")) {
                        stepType = lastStepType;
                    }
                    String step = stepType + " " + matcher.group(2).replace(" \\$", " $");
                    steps.add(step);

                    if (!isAlias) {
                        lastStepType = stepType;
                    }
                }
            }
        }

        return steps;
    }

    private List<File> asList(File[] files) {
        List<File> list = new ArrayList<File>();
        if (files != null) {
            for (File file : files) {
                list.add(file);
            }
        }
        return list;
    }

    private FilenameFilter thatAreJavaSource() {
		return new FilenameFilter() {
			public boolean accept(File dir, String name) {
				return name.endsWith(".java") || name.endsWith(".groovy");
			}
		};
	}

    private FileFilter thatAreDirectories() {
        return new FileFilter() {
            public boolean accept(File file) {
                return file.isDirectory();
            }
        };
    }
}

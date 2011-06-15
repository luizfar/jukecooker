package com.thoughtworks.exception;

public class NoSourceFilesFoundException extends RuntimeException {

    public NoSourceFilesFoundException() {
        super("Could not find any java or groovy files in the specified path.");
    }
}

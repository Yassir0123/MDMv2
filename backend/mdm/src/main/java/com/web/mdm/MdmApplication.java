package com.web.mdm;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class MdmApplication {

	public static void main(String[] args) {
		SpringApplication.run(MdmApplication.class, args);
		System.out.println("hello world");
	}

}

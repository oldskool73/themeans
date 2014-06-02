<?php
	/*Create  Directory Tree if Not Exists
	If you are passing a path with a filename on the end, pass true as the second parameter to snip it off */
	function make_path($pathname, $is_filename=false){
		
	  $mode = 0750;
	
	  if($is_filename){
	
		  $pathname = substr($pathname, 0, strrpos($pathname, '/'));
	
	  }
	
		// Check if directory already exists
	
		if (is_dir($pathname) || empty($pathname)) {
	
			return true;
	
		}
	
		// Ensure a file does not already exist with the same name
	
		$pathname = str_replace(array('/', '\\'), DIRECTORY_SEPARATOR, $pathname);
	
		if (is_file($pathname)) {
	
			trigger_error('mkdirr() File exists', E_USER_WARNING);
	
			return false;
	
		}
	
		// Crawl up the directory tree
	
		$next_pathname = substr($pathname, 0, strrpos($pathname, DIRECTORY_SEPARATOR));
	
		if (make_path($next_pathname, $mode)) {
	
			if (!file_exists($pathname)) {
	
				return mkdir($pathname, $mode);
	
			}
	
		}
	
		return false;
	
	}
?>
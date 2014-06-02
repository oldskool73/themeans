<?php
	// Ensure that your forms and inputs are named in LeadingCamelCase and it will all work fine,
	// Otherwise it will break.
	// Settings
	mb_internal_encoding("UTF-8");
	
	// Path to the webflow html file with the form that you want to angularize
	$htmlFile = './app/views/plan.html';
	$html = file_get_contents($htmlFile,true);
	$doc = new DOMDocument();
	libxml_use_internal_errors(true);
	$doc->loadHTML($html);
	libxml_clear_errors();

	$model = [];

	function find_nodes_by_class($doc,$class,$context){
		$finder = new DomXPath($doc);
		$finder->registerPhpFunctions('preg_match');
		$finder->registerNamespace('php', 'http://php.net/xpath');
		$regex = '@^'.$class.'$|^'.$class.'\s|\s'.$class.'$@';
		return $finder->query(".//*[ php:functionString('preg_match', '$regex', @class) > 0 ]",$context);
	}

	function sanatize($string){
		return preg_replace('/\s+/', '', $string);
	}

	function angularize_forms($nodes){
		global $model;

		if(!$nodes->length)
			return;
			
		for($i = 0 ; $i < $nodes->length ; $i++){
			$form = $nodes->item($i)->getElementsByTagName('form')->item(0);
			$model = [];
			angularize_form($form);
		}

		return "processed $i forms";
	}

	function angularize_form($form){
		global $doc, $model;

		$formName = sanatize($form->getAttribute('data-name'));
		$form->setAttribute('ng-submit',$formName.'Submit()');
		$form->removeAttribute('action');
		$nodes = find_nodes_by_class($doc,'w-input',$form);

		for($i = 0 ; $i < $nodes->length ; $i++){
			angularize_field($nodes->item($i),$formName);
		}
		create_stub(json_encode($model),$formName);
	}

	function angularize_field($field,$scope){
		global $model;

		$fieldName = sanatize($field->getAttribute('data-name'));
		$field->setAttribute('ng-model',$scope.'Model.'.$fieldName);
		array_push($model, $fieldName);
	}

	function create_stub($json,$formName){
		$modelName = $formName.'Model';
		$output = <<<EOT
'use strict';

angular.module('doctaApp')
  .service('$modelName', function $modelName() {
    // AngularJS will instantiate a singleton by calling "new" on this function
    return $json;
  });
EOT;
		
		file_put_contents('./app/scripts/services/'.strtolower($formName).'.js',$output);
	}

	$forms = find_nodes_by_class($doc,'w-form',$doc);
	echo angularize_forms($forms);

	$contents = $doc->saveHTML($doc);
	file_put_contents($htmlFile,$contents);

?>
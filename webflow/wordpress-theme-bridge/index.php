<?php
	
	/**
	 *  Replacement classes
	 *   'wp-the-loop'
	 *    'wp-the-loop-pagination'
	 *    'wp-the-post'
	 *      'wp-the-title'
	 *      'wp-the-excerpt'
	 *      'wp-the-time' // The format for this is in: variables.php
	 *  'wp-sidebar'
	 *    'wp-widget'
	 *      'wp-widget-editable'
	 *  'wp-header'
	 *  'wp-footer'
	 **/
	
	// Includes
	require_once 'externals.php';
	require_once 'variables.php';
	
	// Settings
	mb_internal_encoding("UTF-8");
	
	// Copy the files from below the webflow archive, and into this directory
	$htmlFile = './webflow_html/index.html';
	$html = file_get_contents($htmlFile,true);
	$doc = new DOMDocument();
	libxml_use_internal_errors(true);
	$doc->loadHTML($html);
	libxml_clear_errors();
	
	create_css($doc);
	paths_js($doc);
	paths_img($doc);
	
	// Nuke the functions file first
	file_put_contents("./wordpress/functions.php","");
	extract_children($doc,"wp-the-loop");
	extract_children($doc,"wp-widget");
	extract_children($doc,"wp-sidebar");
	extract_children($doc,"wp-header");
	extract_children($doc,"wp-footer");
	
	$contents = $doc->saveHTML($doc);
	file_put_contents("./wordpress/index.php",$contents);
	
	function extract_children($doc,$class){
		
		$nodes = find_nodes_by_class($doc,$class,$doc);
		
		$index = 0;
		foreach($nodes as $item) {
			if(!$index){
				create_include($item,$class,$class.'.php');
			} else {
				create_include($item,$class,$class."-".$index.'.php');
			}
			$index++;
		}
		
	}
	
	function find_nodes_by_class($doc,$class,$context){
		$finder = new DomXPath($doc);
		$finder->registerPhpFunctions('preg_match');
		$finder->registerNamespace('php', 'http://php.net/xpath');
		$regex = '@^'.$class.'$|^'.$class.'\s|\s'.$class.'$@';
		return $finder->query(".//*[ php:functionString('preg_match', '$regex', @class) > 0 ]",$context);
	}
	
	function create_include($node,$class,$filename){
		
		$doc = $node->ownerDocument;
		// This requires the php closing tag because of 
		// the way the createProcessingInstruction works 
		// in the saveHTML function
		
		$parent = $node->parentNode;

		if($class == 'wp-widget'){
			$fragment = $parent->removeChild($node);
			create_widget($node);
		} else if($class == 'wp-sidebar') {
			//$fragment = $parent->removeChild($node);
			//$contents = $doc->saveHTML($node);
			create_sidebar($node);
		} else if($class == 'wp-the-loop') {
			create_the_loop($node);
		} else {
			$wpname = substr($class, 3);
			$newnode = $doc->createProcessingInstruction('php','get_'.$wpname.'();?');
			$fragment = $parent->replaceChild($newnode,$node);
			$contents = $doc->saveHTML($fragment);
			$contents = '<?php $ss_uri = get_stylesheet_directory_uri();?>'.$contents;
			file_put_contents("./wordpress/".substr($filename,3),$contents);
		}
		
	}
	
	function create_the_loop($node){
		$doc = $node->ownerDocument;
		embed_pagination($doc,$node);
		$class = 'wp-the-post';
		$nodes = find_nodes_by_class($doc,$class,$node);
		for($i = 1 ; $i < $nodes->length ; $i++){
			$node->removeChild($nodes->item($i));
		}
		$item = $nodes->item(0);
		embed_the_function($doc,$item,'wp-the-title','the_title();');
		embed_the_function($doc,$item,'wp-the-excerpt','the_excerpt();');
		global $dateformat;
		embed_the_function($doc,$item,'wp-the-time',"the_time('$dateformat');");
		$oldnode = $node->childNodes->item(0);
		$newnode = $doc->createProcessingInstruction('php','if ( have_posts() ) : while ( have_posts() ) : the_post();?');
		$node->insertBefore($newnode,$oldnode);
		$newnode = $doc->createProcessingInstruction('php','endwhile;endif;?');
		$node->appendChild($newnode);
	}
	
	function embed_pagination($doc,$node){
		$class = 'wp-the-loop-pagination';
		$nodes = find_nodes_by_class($doc,$class,$node);
		for($i = 0 ; $i<$nodes->length ; $i++){
			$item = $nodes->item($i);
			remove_children($item);
			$newnode = $doc->createProcessingInstruction('php','get_template_part( \'pagination\' );?');
			$item->appendChild($newnode);
		}
	}
	
	function remove_children($node){
		$doc = $node->ownerDocument;
		for($i = 0 ; $i < $node->childNodes->length ; $i++){
			$node->removeChild($node->childNodes->item(0));
		}
	}
	
	function embed_the_function($doc,$node,$class,$function){
		$nodes = find_nodes_by_class($doc,$class,$node);
		$newnode = $doc->createProcessingInstruction('php',$function.'?');
		if(!$nodes->length){
			
		}
		$oldnode = $nodes->item(0)->childNodes->item(0);
		$nodes->item(0)->replaceChild($newnode,$oldnode);
	}
	
	function create_widget($node){
		$id = $node->getAttribute('id');
		$id = preg_replace("/[^A-Za-z0-9 ]/", '', $id);
		$doc = $node->ownerDocument;

		$class = "wp-widget-editable";
		$nodes = find_nodes_by_class($doc,$class,$node);
		$form = get_wp_widget_form($nodes);
		$process = get_wp_widget_process($nodes);
		replace_wp_widget_output($nodes);
		$contents = $doc->saveHTML($node);
		
		$eot = 'EOT;';
		$ephp = '?>';
		$str = <<<EOT
<?php
class $id extends WP_Widget {
	public function __construct() {
		\$widget_ops = array('classname' => '$id', 'description' => 'Webflow generated widget.' );
		\$this->WP_Widget('$id', '$id', \$widget_ops);
	}
	public function widget( \$args, \$instance ) {
		\$ss_uri = get_stylesheet_directory_uri();
?>
$contents
<?php
	}
$form
$process
}
add_action( 'widgets_init', function(){
     register_widget( '$id' );
});
$ephp
EOT;
		if(strlen($id)){
			$str = str_replace('%24','$',$str);
			$functioncontent = file_get_contents("./wordpress/functions.php");
			file_put_contents("./wordpress/functions.php",$functioncontent.$str);
		} else {
			echo 'One of the widgets is missing an ID.';
			echo $node->nodeValue;
		}
	}
	
	function get_wp_widget_form($nodes){
		if(!$nodes->length)
			return;
			
		$str = 'public function form( $instance ) {';
		for($i = 0 ; $i < $nodes->length ; $i++){
			$str .= get_wp_form_field($nodes->item($i),$i);
		}
		$str .= '}';

		return $str;

	}
	
	function get_wp_form_field($node,$int){
		$escaped = addslashes(htmlentities($node->nodeValue));
		$str = <<<EOT
if ( isset( \$instance[ 'wp-widget-editable-$int' ] ) ) {
	\$title = \$instance[ 'wp-widget-editable-$int' ];
}
else {
	\$title = __( '$escaped', 'text_domain' );
}
?>
<p>
<label for="<?php echo \$this->get_field_id( 'wp-widget-editable-$int' ); ?>"><?php _e( 'Widget Editable: $int' ); ?></label> 
<input class="widefat" id="<?php echo \$this->get_field_id( 'wp-widget-editable-$int' ); ?>" name="<?php echo \$this->get_field_name( 'wp-widget-editable-$int' ); ?>" type="text" value="<?php echo esc_attr( \$title ); ?>">
</p>
<?php 
EOT;

		return $str;
		
	}
	
	function get_wp_widget_process($nodes){
		if(!$nodes->length)
			return;
			
		$str = 'public function update( $new_instance, $old_instance ) {$instance = array();';
		for($i = 0 ; $i < $nodes->length ; $i++){
			$str .= get_wp_process_field($nodes->item($i),$i);
		}
		$str .= 'return $instance;}';

		return $str;

	}
	
	function get_wp_process_field($node,$int){
		
		$str = <<<EOT
\$instance['wp-widget-editable-$int'] = ( ! empty( \$new_instance['wp-widget-editable-$int'] ) ) ? strip_tags( \$new_instance['wp-widget-editable-$int'] ) : '';
EOT;
		return $str;
		
	}
	
	function replace_wp_widget_output($nodes){
		if(!$nodes->length)
			return;

		$doc = $nodes->item(0)->ownerDocument;
		for($i = 0 ; $i < $nodes->length ; $i++){
			$newnode = $doc->createProcessingInstruction('php','echo apply_filters( "widget_title", $instance["wp-widget-editable-'.$i.'"] );?');
			$oldnode = $nodes->item($i)->childNodes->item(0);
			$nodes->item($i)->replaceChild($newnode,$oldnode);
		}

	}
	
	function create_sidebar($node){
		$id = $node->getAttribute('id');
		$idclean = preg_replace("/[^A-Za-z0-9 ]/", '', $id);
		$eot = 'EOT;';
		$ephp = '?>';
		$str = <<<EOT
<?php
function $idclean() {
	/* Register a dynamic sidebar. */
	register_sidebar(
		array(
			'id' => '$id',
			'name' => __( '$id' ),
			'description' => __( '$id' ),
		)
	);
}
add_action('widgets_init','$idclean');
$ephp
EOT;

		if(strlen($id)){
			$doc = $node->ownerDocument;
			$newnode = $doc->createProcessingInstruction('php','dynamic_sidebar("'.$id.'");?');
			while ($node->hasChildNodes()) {
				$node->removeChild($node->firstChild);
			}
			$node->appendChild($newnode);
			$functioncontent = file_get_contents("./wordpress/functions.php");
			file_put_contents("./wordpress/functions.php",$functioncontent.$str);
		} else {
			echo 'One of the sidebars is missing an ID.';
			echo $node->nodeValue;
		}
	}
	
	function create_css($doc){
		require('css-theme-header.php');
		$contents = $str;
		$finder = new DomXPath($doc);
		$type = "text/css";
		$nodes = $finder->query("//*[contains(@type, '$type')]");
		foreach($nodes as $node){
			$parent = $node->parentNode;
			$link = $parent->removeChild($node);
			$path = $node->getAttribute("href");
			$contents .= file_get_contents("./html/".$path);
		}
		file_put_contents("./wordpress/style.css",$contents);
		$head = $doc->getElementsByTagName("head")->item(0);
		$link->setAttribute("href","style.css");
		$head->appendChild($link);
		$str = <<<EOD
\$href = get_stylesheet_uri();
echo "<link rel='stylesheet' type='text/css' href='\$href'>";
EOD;
		$newnode = $doc->createProcessingInstruction('php',$str.'?');
		$head->appendChild($newnode);
		
	}
	
	function paths_js($doc){
		$scripts = $doc->getElementsByTagName('script');
		$replaces = array();
		
		foreach($scripts as $script){
			$src = $script->getAttribute('src');
			$exsrc = explode('/',$src);
			if($exsrc[0] == 'js'){
				$replaces[] = $script;
			}
		}
		
		foreach($replaces as $script){
			$src = $script->getAttribute('src');
			$str = <<<EOD
\$uri = get_stylesheet_directory_uri();
echo "<script type='text/javascript' src='\$uri/$src'/></script>";
EOD;
			$newnode = $doc->createProcessingInstruction('php',$str.'?');
			$parent = $script->parentNode;
			$parent->replaceChild($newnode,$script);
			make_path('./wordpress/'.$src,true);
			copy('./html/'.$src, './wordpress/'.$src);
		}
	}
	
	function paths_img($doc){
		$images = $doc->getElementsByTagName('img');
		$replaces = array();
		
		// I'm doing a pass with a holding array here
		foreach($images as $image){
			$src = $image->getAttribute('src');
			$exsrc = explode('/',$src);
			if($exsrc[0] == 'images'){
				$replaces[] = $image;
			}
		}
		
		// If I try both of these in the same loop, somehome
		// the original query gets changed
		foreach($replaces as $image){
			make_path('./wordpress/'.$src,true);
			copy('./html/'.$src, './wordpress/'.$src);
			
			$frag = $doc->saveHTML($image);
			$frag = addslashes(preg_replace('/src="(.*?)"/','src="\$ss_uri/$1"',$frag));
			$newnode = $doc->createProcessingInstruction('php',"echo \"$frag\";?");
			$parent = $image->parentNode;
			$parent->replaceChild($newnode,$image);
		}
		
	}

?>
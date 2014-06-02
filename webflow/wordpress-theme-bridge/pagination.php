<?php
global $wp_query;

$big = 10^9; // need an unlikely integer

$page =  paginate_links( array(
	'base' => str_replace( $big, '%#%', esc_url( get_pagenum_link( $big ) ) ),
	'format' => '?paged=%#%',
	'current' => max( 1, get_query_var('paged') ),
	'total' => $wp_query->max_num_pages,
	'add_fragment' => '',
	'before_page_number' => '',
	'after_page_number' => '',
	'show_all'     => True,
	'end_size'     => 1,
	'mid_size'     => 2,
	'prev_next'    => True,
	'prev_text'    => __('<'),
	'next_text'    => __('>'),
	'type'         => 'array',
) );

$prev = '';
$next = '';
$output = '';
$bat = -1;

if(strpos($page[0],'prev'))
	$prev = array_shift($page);
	
if(strpos($page[count($page)-1],'next'))
	$next = array_pop($page);

for($i = 0 ; $i < count($page) ; $i++){
	if (strpos($page[$i],'current') !== false) {
		$output .= ' '.$prev;
		$mod = $i%10;
		$bat = floor($i/10)*10;
		while($mod){
			$mod--;
			$tmp = $page[$bat+$mod] .' '. $tmp;
		}
		$output .= $tmp;
		$mod = $i%10;
		while($mod < 10){
			$output .= ' '.$page[$bat+$mod];
			$mod++;
		}
		$output .= ' '.$next;
	}
	if($i%10 == 0 && ($bat == -1 || $bat != $i))
		$output .= ' '.preg_replace('/>(\d+)/i','>$1-'.strval($i+10),$page[$i]);
}

echo $output;
?>
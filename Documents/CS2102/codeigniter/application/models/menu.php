<?php
class RestaurantModel extends CI_Model {

    var $name   = '';
    var $price = '';
    var $type   = '';
    var $cuisine   = '';
    var $description   = '';

    function __construct()
    {
        // Call the Model constructor
        parent::__construct();
        $this->load->database();
    }
    
    function get_last_ten_entries()
    {
        $query = $this->db->get('menu', 10);
        return $query->result();
    }

    function insert_menu_item($data)
    {
        $this->name   = $data['name']; // please read the below note
        $this->price = $data['price'];
        $this->type    = $data['type'];
        $this->cuisine    = $data['cuisine'];
        $this->description    = $data['description'];
        $this->r_name    = $data['r_name'];
        $this->r_postal_code    = $data['r_postal_code'];
        
        $this->db->insert('menu', $this);
    }

    function update_menu_item($data)
    {
        $where->name   = $data['name']; // please read the below note
        $val->price    = $data['price'];
        $val->type    = $data['type'];
        $val->cuisine    = $data['cuisine'];
        $val->description    = $data['description'];
        $where->r_postal_code    = $data['r_postal_code'];
        $where->r_name    = $data['r_name'];

        $this->db->update('menu', $val, $where);
    }

    function delete_menu_item($data)
    {
        $toBeDeleted->name = $data['name'];
        $toBeDeleted->r_postal_code = $data['r_postal_code'];
        $toBeDeleted->r_name = $data['r_name'];

        $this->db->delete('menu',$toBeDeleted);
    }
}
?>
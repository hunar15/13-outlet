<?php
class RestaurantModel extends CI_Model {

    var $name   = '';
    var $postal_code = '';
    var $address   = '';
    var $phone   = '';
    var $website   = '';
    var $timing   = '';
    var $cuisine   = '';
    var $url   = '';


    function __construct()
    {
        // Call the Model constructor
        parent::__construct();
        $this->load->database();
    }
    
    function get_last_ten_entries()
    {
        $query = $this->db->get('restaurant', 10);
        return $query->result();
    }

    function insert_restaurant($data)
    {
        $this->name   = $data['name']; // please read the below note
        $this->postal_code = $data['postal_code'];
        $this->address    = $data['address'];
        $this->phone    = $data['phone'];
        $this->website    = $data['website'];
        $this->timing    = $data['timing'];
        $this->cuisine    = $data['cuisine'];
        $this->url    = $data['url'];
        $this->db->insert('restaurant', $this);
    }

    function update_restaurant($data)
    {
        $this->name   = $data['name']; // please read the below note
        $this->postal_code = $data['postal_code'];
        $val->address    = $data['address'];
        $val->phone    = $data['phone'];
        $val->website    = $data['website'];
        $val->timing    = $data['timing'];
        $val->cuisine    = $data['cuisine'];
        $val->url    = $data['url'];

        $this->db->update('restaurant', $val, array('name' => $data['name'], 'postal_code'=> $data['postal_code']));
    }

    function delete_restaurant($data)
    {
        $toBeDeleted->name = $data['name'];
        $toBeDeleted->postal_code = $data['postal_code'];

        $this->db->delete('restaurant',$toBeDeleted);
    }
}
?>
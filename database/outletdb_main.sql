-- MySQL dump 10.13  Distrib 5.5.28, for osx10.6 (i386)
--
-- Host: localhost    Database: outletdb
-- ------------------------------------------------------
-- Server version	5.5.28

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `batch_request`
--

DROP TABLE IF EXISTS `batch_request`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `batch_request` (
  `date` date NOT NULL,
  `status` varchar(15) NOT NULL,
  PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batch_request`
--

LOCK TABLES `batch_request` WRITE;
/*!40000 ALTER TABLE `batch_request` DISABLE KEYS */;
/*!40000 ALTER TABLE `batch_request` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `display`
--

DROP TABLE IF EXISTS `display`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `display` (
  `display_id` int(11) NOT NULL,
  `barcode` int(11) DEFAULT NULL,
  `description` varchar(40) DEFAULT NULL,
  PRIMARY KEY (`display_id`),
  UNIQUE KEY `barcode` (`barcode`),
  CONSTRAINT `display_ibfk_1` FOREIGN KEY (`barcode`) REFERENCES `product` (`barcode`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `display`
--

LOCK TABLES `display` WRITE;
/*!40000 ALTER TABLE `display` DISABLE KEYS */;
/*!40000 ALTER TABLE `display` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory`
--

DROP TABLE IF EXISTS `inventory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory` (
  `barcode` int(11) NOT NULL,
  `stock` int(11) NOT NULL,
  `selling_price` float NOT NULL,
  `min_stock` int(11) NOT NULL,
  PRIMARY KEY (`barcode`),
  CONSTRAINT `inventory_ibfk_1` FOREIGN KEY (`barcode`) REFERENCES `product` (`barcode`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory`
--

LOCK TABLES `inventory` WRITE;
/*!40000 ALTER TABLE `inventory` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product` (
  `barcode` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `cost_price` float NOT NULL,
  `category` varchar(150) NOT NULL,
  `manufacturer` varchar(150) NOT NULL,
  `status` varchar(15) NOT NULL,
  PRIMARY KEY (`barcode`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `request_details`
--

DROP TABLE IF EXISTS `request_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `request_details` (
  `date` date NOT NULL,
  `barcode` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `received` tinyint(1) NOT NULL,
  PRIMARY KEY (`date`,`barcode`),
  KEY `barcode` (`barcode`),
  CONSTRAINT `request_details_ibfk_6` FOREIGN KEY (`barcode`) REFERENCES `product` (`barcode`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `request_details_ibfk_5` FOREIGN KEY (`date`) REFERENCES `batch_request` (`date`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `request_details`
--

LOCK TABLES `request_details` WRITE;
/*!40000 ALTER TABLE `request_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `request_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `sold_yesterday`
--

DROP TABLE IF EXISTS `sold_yesterday`;
/*!50001 DROP VIEW IF EXISTS `sold_yesterday`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE TABLE `sold_yesterday` (
  `barcode` tinyint NOT NULL,
  `date` tinyint NOT NULL,
  `price` tinyint NOT NULL,
  `total` tinyint NOT NULL
) ENGINE=MyISAM */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `transaction`
--

DROP TABLE IF EXISTS `transaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transaction` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cashier_id` char(4) NOT NULL,
  `date` date NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction`
--

LOCK TABLES `transaction` WRITE;
/*!40000 ALTER TABLE `transaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `transaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transaction_details`
--

DROP TABLE IF EXISTS `transaction_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transaction_details` (
  `id` int(11) NOT NULL,
  `barcode` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` float NOT NULL,
  PRIMARY KEY (`id`,`barcode`),
  KEY `barcode` (`barcode`),
  CONSTRAINT `transaction_details_ibfk_3` FOREIGN KEY (`id`) REFERENCES `transaction` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `transaction_details_ibfk_4` FOREIGN KEY (`barcode`) REFERENCES `product` (`barcode`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transaction_details`
--

LOCK TABLES `transaction_details` WRITE;
/*!40000 ALTER TABLE `transaction_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `transaction_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `yesterday`
--

DROP TABLE IF EXISTS `yesterday`;
/*!50001 DROP VIEW IF EXISTS `yesterday`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE TABLE `yesterday` (
  `barcode` tinyint NOT NULL,
  `date` tinyint NOT NULL,
  `price` tinyint NOT NULL,
  `quantity` tinyint NOT NULL
) ENGINE=MyISAM */;
SET character_set_client = @saved_cs_client;

--
-- Final view structure for view `sold_yesterday`
--

/*!50001 DROP TABLE IF EXISTS `sold_yesterday`*/;
/*!50001 DROP VIEW IF EXISTS `sold_yesterday`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `sold_yesterday` AS select `tb`.`barcode` AS `barcode`,`tb`.`date` AS `date`,`tb`.`price` AS `price`,sum(`tb`.`quantity`) AS `total` from `yesterday` `tb` group by `tb`.`barcode` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `yesterday`
--

/*!50001 DROP TABLE IF EXISTS `yesterday`*/;
/*!50001 DROP VIEW IF EXISTS `yesterday`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8 */;
/*!50001 SET character_set_results     = utf8 */;
/*!50001 SET collation_connection      = utf8_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `yesterday` AS select `d`.`barcode` AS `barcode`,`t`.`date` AS `date`,`d`.`price` AS `price`,`d`.`quantity` AS `quantity` from (`transaction` `t` join `transaction_details` `d`) where ((`t`.`id` = `d`.`id`) and (`t`.`date` = (curdate() - interval 1 day))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2012-12-03 18:11:59

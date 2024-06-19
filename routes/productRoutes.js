import express from "express";
import * as productController from "../controllers/productController.js";
import * as authController from "../controllers/authController.js";
import * as reviewController from "../controllers/reviewController.js";
import reviewRouter from "./reviewRoutes.js";

const router = express.Router();

// {{URL}}/api/products?fields=name, price

// use reviewRoute for this. it get the product id
router.use("/:productID/reviews", reviewRouter);

router.post("/insertMany", productController.insertProducts);

router
  .route("/")
  .get(productController.getAllProducts)
  .post(
    authController.protect,
    authController.restrictTo("admin", "manager"),
    productController.createProduct
  );

router
  .route("/:id")
  .get(productController.getProduct)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "manager"),
    productController.updateProduct
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "manager"),
    productController.deleteProduct
  );

export default router;

from decimal import Decimal

from rest_framework import status
from rest_framework.views import APIView, Response

from ..models import Product, ProductCategory
from ..serializer_dir.item_activity_serializer import ItemActivitySerializer
from ..serializer_dir.product_serializer import ProductSerializer


class ProductViewClass(APIView):
    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def update_item_activity(action):
        pass

    def get(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch
        if id:
            # get single product
            print("this is role hahaha ", role)
            if role in ["BRANCH_MANAGER", "WAITER", "COUNTER", "KITCHEN"]:
                branch_product = Product.objects.get(id=id)
                if branch_product.category.branch == my_branch:
                    product_details = ProductSerializer(branch_product)
                    return Response({"success": True, "data": product_details.data})

            if role in ["SUPER_ADMIN", "ADMIN"]:
                product = Product.objects.get(id=id)
                serilizer = ProductSerializer(product)
                return Response({"success": True, "data": serilizer.data})
        else:
            if role in ["BRANCH_MANAGER", "WAITER", "COUNTER", "KITCHEN"] and my_branch:
                products = Product.objects.filter(category__branch=my_branch)
                serilizer = ProductSerializer(products, many=True)
                return Response({"success": True, "data": serilizer.data})

            if role in ["ADMIN", "SUPER_ADMIN"]:
                products = Product.objects.all()
                serilizer = ProductSerializer(products, many=True)
                return Response({"success": True, "data": serilizer.data})

            if not my_branch:
                return Response(
                    {"success": False, "message": "Branch not found"}, status=400
                )

            return Response(
                {"success": False, "message": "User Type not found"}, status=400
            )

    def post(self, request, product_id=None, action=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if action:
            if product_id:
                product = Product.objects.get(id=product_id)
                data = request.data.copy()

                data["product"] = product_id

                original_qty = product.product_quantity

                if action == "add":
                    data["quantity"] = original_qty + int(data["change"])
                    data["types"] = "ADD_STOCK"

                if action == "reduce":
                    data["quantity"] = original_qty - int(data["change"])
                    data["types"] = "REDUCE_STOCK"

                serializer = ItemActivitySerializer(data=data)

                if serializer.is_valid():
                    product.product_quantity = Decimal(
                        serializer.validated_data["quantity"]
                    )
                    product.save()
                    serializer.save()

                    return Response(
                        {
                            "success": True,
                            "message": "modified product successfully",
                            "data": serializer.data,
                        }
                    )
                return Response(
                    {
                        "success": False,
                        "message": "Validation error",
                        "errors": serializer.errors,
                    },
                    status=status.HTTP_400_BAD_REQUEST,  # Changed from 403 to 400
                )

        if role not in ["BRANCH_MANAGER", "SUPER_ADMIN", "ADMIN"]:
            return Response(
                {
                    "success": False,
                    "message": "You don't have Permission to create Product!",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Get and validate product name
        product_name = request.data.get("name", "").strip()
        if not product_name:
            print("i reach at not product_name if condition!")
            return Response(
                {
                    "success": False,
                    "message": "Product name is required.",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Check if product already exists (case-insensitive)
        existing_product = Product.objects.filter(name__iexact=product_name).first()

        if existing_product:
            return Response(
                {
                    "success": False,
                    "message": f"Product '{product_name}' already exists.",
                    "existing_product": {
                        "id": existing_product.id,
                        "name": existing_product.name,
                        "category": existing_product.category.name
                        if existing_product.category
                        else None,
                        "branch": existing_product.category.branch.name
                        if existing_product.category
                        else None,
                    },
                },
                status=status.HTTP_409_CONFLICT,  # 409 Conflict is perfect for this
            )

        # Prepare data
        data = request.data.copy()
        if not my_branch:
            my_branch = data["branch"]
        if my_branch:
            data["branch"] = my_branch

        # Validate category exists and belongs to user's branch
        category_id = data.get("category")
        if category_id:
            try:
                category = ProductCategory.objects.get(id=category_id, branch=my_branch)
            except ProductCategory.DoesNotExist:
                return Response(
                    {
                        "success": False,
                        "message": f"Category with ID {category_id} not found in your branch.",
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Validate selling price > cost price (business logic)
        cost_price = data.get("cost_price", 0)
        selling_price = data.get("selling_price", 0)
        if selling_price < cost_price:
            return Response(
                {
                    "success": False,
                    "message": "Selling price cannot be less than cost price.",
                    "cost_price": float(cost_price),
                    "selling_price": float(selling_price),
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Create serializer and save
        serializer = ProductSerializer(data=data, context={"request": request})

        if serializer.is_valid():
            try:
                serializer.save()

                itemactivity = {
                    "change": serializer.validated_data["product_quantity"],
                    "quantity": serializer.validated_data["product_quantity"],
                    "product": serializer.data["id"],
                    "types": "ADD_STOCK",
                    "remarks": "Opening Stock",
                }

                itemserilizer = ItemActivitySerializer(data=itemactivity)
                if itemserilizer.is_valid():
                    itemserilizer.save()

                return Response(
                    {
                        "success": True,
                        "message": "Product created successfully",
                        "Poduct_data": serializer.data,
                        "itemactivity_data": itemserilizer.data,
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                return Response(
                    {
                        "success": False,
                        "message": "An error occurred while saving the product.",
                        "error": str(e),
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        else:
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                    "message": "Validation failed",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def put(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        # Permission check
        if role != "BRANCH_MANAGER" and role != "SUPER_ADMIN":
            return Response(
                {
                    "success": False,
                    "message": "Insufficient permissions to update products.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        # Validate ID
        if not id:
            return Response(
                {"success": False, "message": "Product ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            # Get product with related category for branch validation
            product = Product.objects.select_related(
                "category", "category__branch"
            ).get(id=id)

            # Verify product belongs to user's branch
            if product.category.branch != my_branch and role != "SUPER_ADMIN":
                return Response(
                    {
                        "success": False,
                        "message": "You can only update products in your own branch.",
                    },
                    status=status.HTTP_403_FORBIDDEN,
                )

        except Product.DoesNotExist:
            return Response(
                {"success": False, "message": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check for duplicate product name
        new_name = request.data.get("name")
        if new_name and new_name != product.name:
            new_name = new_name.strip()
            if (
                Product.objects.filter(name__iexact=new_name)
                .exclude(id=product.id)
                .exists()
            ):
                return Response(
                    {
                        "success": False,
                        "message": f"A product named '{new_name}' already exists.",
                        "field": "name",
                        "suggestion": f"Try '{new_name} - {my_branch.code}'"
                        if hasattr(my_branch, "code")
                        else None,
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        # Business logic validations
        errors = {}

        # Price validation
        cost_price = request.data.get("cost_price", product.cost_price)
        selling_price = request.data.get("selling_price", product.selling_price)

        if selling_price and cost_price and selling_price < cost_price:
            errors["selling_price"] = (
                "Selling price must be greater than or equal to cost price."
            )

        # Stock validation
        product_quantity = request.data.get("product_quantity")
        low_stock_bar = request.data.get("low_stock_bar", product.low_stock_bar)

        if product_quantity is not None and low_stock_bar is not None:
            if product_quantity < 0:
                errors["product_quantity"] = "Product quantity cannot be negative."
            if low_stock_bar < 0:
                errors["low_stock_bar"] = "Low stock threshold cannot be negative."

        if errors:
            return Response(
                {"success": False, "errors": errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Track changes for audit log
        old_data = {
            "name": product.name,
            "cost_price": str(product.cost_price),
            "selling_price": str(product.selling_price),
            "quantity": product.product_quantity,
            "is_available": product.is_available,
        }

        # Update product
        serializer = ProductSerializer(
            product, data=request.data, partial=True, context={"request": request}
        )

        if serializer.is_valid():
            updated_product = serializer.save()

            # Get new data for audit
            new_data = {
                "name": updated_product.name,
                "cost_price": str(updated_product.cost_price),
                "selling_price": str(updated_product.selling_price),
                "quantity": updated_product.product_quantity,
                "is_available": updated_product.is_available,
            }

            # Log the update (you could save this to an AuditLog model)
            import logging

            logger = logging.getLogger("product_updates")
            logger.info(
                f"Product updated: ID={product.id}, "
                f"User={request.user.email}, "
                f"Old={old_data}, "
                f"New={new_data}"
            )

            return Response(
                {
                    "success": True,
                    "message": "Product updated successfully",
                    "data": serializer.data,
                    "changes": {"old": old_data, "new": new_data},
                },
                status=status.HTTP_200_OK,
            )
        else:
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors,
                    "message": "Validation failed",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

    def delete(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if role not in ["SUPER_ADMIN", "BRANCH_MANAGER", "ADMIN"]:
            return Response(
                {
                    "success": False,
                    "message": "You don't have permission to delete products.",
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not id:
            return Response(
                {"success": False, "message": "Product ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            if role in ["ADMIN", "SUPER_ADMIN"]:
                product = Product.objects.get(id=id)
            else:
                product = Product.objects.get(id=id, category__branch=my_branch)

            product_name = product.name
            product.delete()

            return Response(
                {
                    "success": True,
                    "message": f"Product '{product_name}' deleted successfully.",
                },
                status=status.HTTP_200_OK,
            )

        except Product.DoesNotExist:
            return Response(
                {"success": False, "message": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

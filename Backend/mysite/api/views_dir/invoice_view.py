from datetime import date

from django.db import transaction
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Invoice
from ..serializer_dir.invoice_serializer import (
    InvoiceResponseSerializer,
    InvoiceSerializer,
)


class InvoiceViewClass(APIView):
    todaydate = date.today()
    print(todaydate)

    def get_user_role(self, user):
        return "SUPER_ADMIN" if user.is_superuser else getattr(user, "user_type", "")

    def get_branch_filter(self, user, role):
        if role in ["ADMIN", "SUPER_ADMIN"]:
            return {}
        elif user.branch:
            return {"branch": user.branch}
        return {"branch__isnull": True}

    def get(self, request, id=None):
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if id:
            try:
                # Apply branch filter for non-admin users
                if role not in ["ADMIN", "SUPER_ADMIN"] and my_branch:
                    invoice = Invoice.objects.get(
                        branch=my_branch, created_at__date=self.todaydate, id=id
                    )
                    serializer = InvoiceResponseSerializer(invoice)
                    return Response({"success": True, "data": serializer.data})
                else:
                    invoice = Invoice.objects.get(id=id)
                    serializer = InvoiceResponseSerializer(invoice)
                    return Response({"success": True, "data": serializer.data})

            except Invoice.DoesNotExist:
                return Response(
                    {"success": False, "error": "Invoice not found"},
                    status=status.HTTP_404_NOT_FOUND,  # ✅ Use status constants
                )
        else:
            if role in ["COUNTER", "WAITER", "KITCHEN"]:
                invoices = Invoice.objects.filter(
                    branch=my_branch, created_at__date=self.todaydate
                ).order_by("-created_at")

                serializer = InvoiceResponseSerializer(invoices, many=True)
                return Response({"success": True, "data": serializer.data})

            if role == "BRANCH_MANAGER":
                invoices = Invoice.objects.filter(branch=my_branch).order_by(
                    "-created_at"
                )

            invoices = Invoice.objects.all().order_by("-created_at")
            serializer = InvoiceResponseSerializer(invoices, many=True)
            return Response({"success": True, "data": serializer.data})

    # ------------------ POST (Create) ------------------
    @transaction.atomic
    def post(self, request):
        """Create new invoice"""
        role = self.get_user_role(request.user)

        # Check permissions
        if role not in ["ADMIN", "SUPER_ADMIN", "COUNTER", "WAITER", "BRANCH_MANAGER"]:
            return Response(
                {"success": False, "error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN,  # ✅ Use status constants
            )

        serializer = InvoiceSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            try:
                invoice = serializer.save()
                response_serializer = InvoiceResponseSerializer(invoice)
                return Response(
                    {"success": True, "data": response_serializer.data},
                    status=status.HTTP_201_CREATED,  # ✅ Use status constants
                )
            except Exception as e:
                return Response(
                    {"success": False, "error": str(e)},
                    status=status.HTTP_400_BAD_REQUEST,  # ✅ Use status constants
                )

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,  # ✅ Use status constants
        )

    # ------------------ PATCH (Update) ------------------
    @transaction.atomic
    def patch(self, request, id):
        """Update invoice partially"""
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        try:
            # Apply branch filter for non-admin users
            filter_kwargs = {"id": id}
            if role not in ["ADMIN", "SUPER_ADMIN"] and my_branch:
                filter_kwargs["branch"] = my_branch.id
            invoice = Invoice.objects.get(**filter_kwargs)
        except Invoice.DoesNotExist:
            return Response(
                {"success": False, "error": "Invoice not found"},
                status=status.HTTP_404_NOT_FOUND,  # ✅ Use status constants
            )

        # Don't allow modifying paid/cancelled invoices
        if invoice.payment_status in ["PAID", "CANCELLED"]:
            return Response(
                {
                    "success": False,
                    "error": f"Cannot modify {invoice.payment_status.lower()} invoice",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Only allow updating safe fields
        allowed_fields = ["notes", "description", "is_active", "invoice_status"]
        if role in ["ADMIN", "SUPER_ADMIN"]:
            allowed_fields.extend(["tax_amount", "discount"])

        data = {k: v for k, v in request.data.items() if k in allowed_fields}

        serializer = InvoiceResponseSerializer(invoice, data=data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"success": True, "data": serializer.data})

        return Response(
            {"success": False, "errors": serializer.errors},
            status=status.HTTP_400_BAD_REQUEST,  # ✅ Use status constants
        )

    # ------------------ DELETE ------------------
    def delete(self, request, id):
        """Delete invoice"""
        role = self.get_user_role(request.user)
        my_branch = request.user.branch

        if role not in ["ADMIN", "SUPER_ADMIN"]:
            return Response(
                {"success": False, "error": "Permission denied"},
                status=status.HTTP_403_FORBIDDEN,  # ✅ Use status constants
            )

        try:
            # Apply branch filter for non-admin users
            filter_kwargs = {"id": id}
            if role not in ["ADMIN", "SUPER_ADMIN"] and my_branch:
                filter_kwargs["branch"] = my_branch

            invoice = Invoice.objects.get(**filter_kwargs)

            # Don't delete paid invoices
            if invoice.payment_status == "PAID":
                return Response(
                    {"success": False, "error": "Cannot delete paid invoice"},
                    status=status.HTTP_400_BAD_REQUEST,  # ✅ Use status constants
                )

            invoice.delete()
            return Response(
                {"success": True, "message": "Invoice deleted"},
                status=status.HTTP_204_NO_CONTENT,  # ✅ Use status constants
            )

        except Invoice.DoesNotExist:
            return Response(
                {"success": False, "error": "Invoice not found"},
                status=status.HTTP_404_NOT_FOUND,  # ✅ Use status constants
            )

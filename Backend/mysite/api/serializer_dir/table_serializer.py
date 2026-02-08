from rest_framework import serializers
from ..models import Table


class TableSerializer(serializers.ModelSerializer):
    branch_name = serializers.CharField(source="branch.name", read_only=True)

    class Meta:
        model = Table
        fields = ["table_no","id", "branch", "branch_name", "is_free"]

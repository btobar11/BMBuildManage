const API_URL = 'http://localhost:3001/api/v1';
const HEADERS = {
  'Authorization': 'Bearer dev-token',
  'Content-Type': 'application/json'
};

async function runTest() {
  console.log('🚀 Starting BMBuildManage E2E Pilot Smoke Test...\n');
  try {
    // 1. Projects
    console.log('--- 1. Fetching Projects ---');
    let res = await fetch(`${API_URL}/projects`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Projects API failed: ${res.statusText}`);
    let projects = await res.json();
    console.log(`Found ${projects.length} projects.`);
    
    // Find the Demo project
    let project = projects.find(p => p.name.includes('Loft Providencia'));
    if (!project) throw new Error('Demo project not found');
    console.log(`✅ Project Selected: ${project.name} (ID: ${project.id})`);

    // 2. Budgets
    console.log('\n--- 2. Fetching Budgets ---');
    res = await fetch(`${API_URL}/budgets?project_id=${project.id}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Budgets API failed`);
    let budgets = await res.json();
    let budget = budgets.find(b => b.is_active);
    if (!budget) throw new Error('Active budget not found');
    console.log(`✅ Active Budget Selected: Version ${budget.version} (ID: ${budget.id})`);

    // 3. Stages & Items
    console.log('\n--- 3. Fetching Full Budget Details ---');
    res = await fetch(`${API_URL}/budgets/${budget.id}`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Budget details API failed`);
    let budgetDetails = await res.json();
    let stages = budgetDetails.stages || [];
    console.log(`✅ Found ${stages.length} stages.`);
    let targetItem;
    for (const stage of stages) {
      if (stage.items && stage.items.length > 0) {
        targetItem = stage.items[0];
        break;
      }
    }
    if (!targetItem) throw new Error('No items found to modify');
    console.log(`✅ Target Item Selected: ${targetItem.name}`);

    // 4. Edit Budget Item (Price & Quantity)
    console.log('\n--- 4. Modifying Budget Item ---');
    let newPrice = Number(targetItem.unit_price) + 5000;
    let newQty = Number(targetItem.quantity) + 10;
    res = await fetch(`${API_URL}/items/${targetItem.id}`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ unit_price: newPrice, quantity: newQty })
    });
    if (!res.ok) throw new Error(`Item PATCH API failed`);
    let updatedItem = await res.json();
    console.log(`✅ Item Updated: Price -> ${updatedItem.unit_price}, Qty -> ${updatedItem.quantity}`);

    // 5. Add Expense
    console.log('\n--- 5. Registering Expense ---');
    res = await fetch(`${API_URL}/expenses`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        project_id: project.id,
        description: 'Flete de materiales extra - Prueba E2E',
        amount: 25000,
        expense_type: 'other',
        date: new Date().toISOString()
      })
    });
    if (!res.ok) throw new Error(`Expenses POST API failed: ${await res.text()}`);
    let newExpense = await res.json();
    console.log(`✅ Expense Logged: ${newExpense.description} ($${newExpense.amount})`);

    // 6. Summary Validation
    console.log('\n--- 6. Fetching Financial Summary ---');
    res = await fetch(`${API_URL}/budgets/project/${project.id}/summary`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Summary API failed: ${await res.text()}`);
    let summary = await res.json();
    console.log(`✅ Summary Retrieved:`);
    console.log(`   Estimated Cost : $${summary.financials.estimatedCost}`);
    console.log(`   Estimated Price: $${summary.financials.estimatedPrice}`);
    console.log(`   Real Cost      : $${summary.financials.totalRealCost}`);

    // 7. Budget Revision
    console.log('\n--- 7. Creating Budget Revision ---');
    res = await fetch(`${API_URL}/budgets/${budget.id}/revision`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ notes: 'Revisión automática desde E2E test' })
    });
    if (!res.ok) throw new Error(`Revise POST API failed: ${await res.text()}`);
    let revision = await res.json();
    console.log(`✅ Revision Created: ID ${revision.id}, Version ${revision.version}`);

    // 8. PDF Export
    console.log('\n--- 8. Testing Export (PDF) ---');
    res = await fetch(`${API_URL}/budgets/${budget.id}/export/pdf`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Export API failed`);
    let contentType = res.headers.get('content-type');
    console.log(`✅ PDF Generated: Content-Type = ${contentType}`);

    // 9. Audit Logs
    console.log('\n--- 9. Verifying Audit Logs ---');
    res = await fetch(`${API_URL}/audit-logs?entity_id=${targetItem.id}&entity_name=Item`, { headers: HEADERS });
    if (!res.ok) throw new Error(`Audit Logs API failed`);
    let logs = await res.json();
    console.log(`✅ Found ${logs.length} audit logs for modified item.`);
    if (logs.length > 0) {
      console.log(`   Latest action: ${logs[0].action} by user ${logs[0].user_id}`);
    }

    console.log('\n🎉 ALL E2E PILOT WORKFLOWS VERIFIED SUCCESSFULLY!');

  } catch (err) {
    console.error(`\n❌ TEST FAILED: ${err.message}`);
    process.exit(1);
  }
}

runTest();

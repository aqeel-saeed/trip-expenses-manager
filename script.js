// Variables to hold data
let families = [];
let expenses = [];
let pays = [];

// Show and hide sections
const familySection = document.getElementById("family-section");
const expenseSection = document.getElementById("expense-section");
const paySection = document.getElementById("pay-section");
const resultSection = document.getElementById("result-section");

// Add a family
document.getElementById('add-family').addEventListener('click', () => {
    let familyName = document.querySelector('.family-name').value;
    let familySize = document.querySelector('.family-size').value;
    
    if(familyName && familySize) {
        families.push({
            name: familyName,
            size: parseFloat(familySize)
        });
        // Reset inputs
        document.querySelector('.family-name').value = '';
        document.querySelector('.family-size').value = '';
        alert('Family added!');
    }
});

// Proceed to adding expenses
document.getElementById('next-to-expenses').addEventListener('click', () => {
    if(families.length > 0) {
        populateFamilyCheckboxes();
        familySection.classList.add('hidden');
        expenseSection.classList.remove('hidden');
    } else {
        alert('Please add at least one family.');
    }
});

// Populate family checkboxes for expense exclusions
function populateFamilyCheckboxes() {
    let checkboxContainer = document.getElementById('family-checkboxes');
    checkboxContainer.innerHTML = '';
    families.forEach((family, index) => {
        let checkbox = `<label><input type="checkbox" class="family-checkbox" value="${index}">${family.name}</label><br>`;
        checkboxContainer.innerHTML += checkbox;
    });
}

// Add an expense
document.getElementById('add-expense').addEventListener('click', () => {
    let expenseName = document.querySelector('.expense-name').value;
    let expenseAmount = document.querySelector('.expense-amount').value;
    let excludedFamilies = Array.from(document.querySelectorAll('.family-checkbox:checked')).map(cb => parseInt(cb.value));
    
    if(expenseName && expenseAmount) {
        expenses.push({
            name: expenseName,
            amount: parseFloat(expenseAmount),
            excludedFamilies
        });
        // Reset inputs
        document.querySelector('.expense-name').value = '';
        document.querySelector('.expense-amount').value = '';
        alert('Expense added!');
    }
});

// Proceed to adding pays
document.getElementById('next-to-pays').addEventListener('click', () => {
    if(expenses.length > 0) {
        populateFamilyDropdown();
        expenseSection.classList.add('hidden');
        paySection.classList.remove('hidden');
    } else {
        alert('Please add at least one expense.');
    }
});

// Populate family dropdown for pays
function populateFamilyDropdown() {
    let dropdown = document.querySelector('.pay-family');
    dropdown.innerHTML = '';
    families.forEach((family, index) => {
        dropdown.innerHTML += `<option value="${index}">${family.name}</option>`;
    });
}

// Add a pay
document.getElementById('add-pay').addEventListener('click', () => {
    let payName = document.querySelector('.pay-name').value;
    let payAmount = document.querySelector('.pay-amount').value;
    let payFamily = document.querySelector('.pay-family').value;
    
    if(payName && payAmount) {
        pays.push({
            name: payName,
            amount: parseFloat(payAmount),
            familyIndex: parseInt(payFamily)
        });
        // Reset inputs
        document.querySelector('.pay-name').value = '';
        document.querySelector('.pay-amount').value = '';
        alert('Pay added!');
    }
});

// Calculate and generate invoices
document.getElementById('calculate').addEventListener('click', () => {
    let results = calculateInvoices(families, expenses, pays);
    showResults(results);
    saveAsJson({ families, expenses, pays });
});

// Logic to calculate the invoices
function calculateInvoices(families, expenses, pays) {
    let invoices = families.map((family, index) => {
        let totalExpense = 0;
        let totalPaid = 0;
        let expenseDetails = [];  // New array to hold breakdown for each expense
        let paymentDetails = [];  // New array to hold breakdown for each payment

        // Calculate the family's total expense
        expenses.forEach(expense => {
            // Step 1: Calculate total people involved in the expense (exclude excluded families)
            let totalPeople = families.reduce((sum, fam, i) => {
                if (!expense.excludedFamilies.includes(i)) {
                    return sum + fam.size; // sum the sizes of included families
                }
                return sum;
            }, 0);
            
            // Step 2: If the family is not excluded, calculate their portion of the expense
            if (!expense.excludedFamilies.includes(index)) {
                let perPersonShare = expense.amount / totalPeople; // x: amount per person
                let familyShare = perPersonShare * family.size;     // z: total amount for family (x * y)

                totalExpense += familyShare;

                // Store the detailed breakdown for this expense
                expenseDetails.push({
                    expenseName: expense.name,
                    perPerson: perPersonShare.toFixed(2), // x
                    familySize: family.size,              // y
                    totalAmount: familyShare.toFixed(2)   // z
                });
            }
        });

        // Calculate the family's total paid and store payment details
        pays.forEach(pay => {
            if (pay.familyIndex === index) {
                totalPaid += pay.amount;
                // Store the breakdown for each payment
                paymentDetails.push({
                    paymentName: pay.name,
                    amount: pay.amount.toFixed(2)
                });
            }
        });

        return {
            familyName: family.name,
            totalExpense,
            totalPaid,
            balance: totalPaid - totalExpense,
            details: expenseDetails,  // Include expense breakdown
            payments: paymentDetails  // Include payment breakdown
        };
    });

    return invoices;
}


function showResults(invoices) {
    const invoicesDiv = document.getElementById('invoices');
    invoicesDiv.innerHTML = '';  // Clear previous results

    invoices.forEach(invoice => {
        // Create a new div for each family's invoice
        let invoiceHTML = `
            <div class="invoice">
                <h3 class="invoice-heading">Invoice for ${invoice.familyName}</h3>
                
                <!-- Expense Details -->
                <h4>Expenses:</h4>
                <ul>
        `;

        // Add the detailed breakdown for each expense
        invoice.details.forEach(detail => {
            invoiceHTML += `
                <li>${detail.expenseName} (${detail.perPerson} * ${detail.familySize} = <strong>${detail.totalAmount}</strong>)</li>
            `;
        });

        // Add payment details only if the family has payments
        if (invoice.payments.length > 0) {
            invoiceHTML += `
                </ul>
                <h4>Payments:</h4>
                <ul>
            `;

            invoice.payments.forEach(payment => {
                invoiceHTML += `
                    <li>${payment.paymentName}: $${payment.amount}</li>
                `;
            });

            invoiceHTML += `
                </ul>
            `;
        }

        if (invoice.balance >= 0) {
            // Add total expense, paid, and balance info
            invoiceHTML += `
                    <p class="green"><strong>Total Expense:</strong> $${invoice.totalExpense.toFixed(2)}</p>
                    <p class="red"><strong>Total Paid:</strong> $${invoice.totalPaid.toFixed(2)}</p>
                    <p class="green"><strong>Balance:</strong> $${invoice.balance.toFixed(2)}</p>
                </div>
            `;
        } else {
            // Add total expense, paid, and balance info
            invoiceHTML += `
                    <p class="green"><strong>Total Expense:</strong> $${invoice.totalExpense.toFixed(2)}</p>
                    <p class="red"><strong>Total Paid:</strong> $${invoice.totalPaid.toFixed(2)}</p>
                    <p class="red"><strong>Balance:</strong> $${invoice.balance.toFixed(2)}</p>
                </div>
            `;
        }


        invoicesDiv.innerHTML += invoiceHTML;
    });

    resultSection.classList.remove('hidden');  // Ensure results section is visible
}




// Save the data as JSON
function saveAsJson(data) {
    const jsonData = JSON.stringify(data);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'trip-data.json';
    link.click();
}

// Load data from JSON file
document.getElementById('calculate-from-file').addEventListener('click', () => {
    const fileInput = document.getElementById('json-file');
    const file = fileInput.files[0];
    
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const data = JSON.parse(e.target.result);
            let results = calculateInvoices(data.families, data.expenses, data.pays);
            showResults(results);
        };
        reader.readAsText(file);
    } else {
        alert('Please select a JSON file.');
    }
});

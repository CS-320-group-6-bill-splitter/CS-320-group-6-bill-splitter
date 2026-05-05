from decimal import Decimal

from asgiref.sync import sync_to_async
from django.test import TestCase, override_settings
from django.urls import reverse

from core.models import Bill, Debt, Household, HouseholdInvitation, User
from core.serializers import HouseholdInvitationSerializer, HouseholdSerializer


## general helpers

async def _make_user(email, display_name='Test User', password='testpass123'):
    return await sync_to_async(User.objects.create_user)(
        email=email, display_name=display_name, password=password
    )


async def _make_household(name, creator):
    return await sync_to_async(Household.objects.create_household)(name, creator)


async def _make_bill(name, household, amount, user_owed, debts):
    return await sync_to_async(Bill.objects.create_bill)(
        name=name, household=household, amount=amount,
        user_owed=user_owed, debts=debts,
    )


class HouseholdModelTests(TestCase):

    async def test_create_household_adds_creator_as_member(self):
        alice = await _make_user('alice@example.com', 'Alice')
        household = await _make_household('Test', alice)
        members = await sync_to_async(list)(household.members.all())
        self.assertIn(alice, members)

    async def test_add_member(self):
        alice = await _make_user('alice@example.com', 'Alice')
        bob = await _make_user('bob@example.com', 'Bob')
        household = await _make_household('Test', alice)
        await sync_to_async(household.add_member)(bob)
        members = await sync_to_async(list)(household.members.all())
        self.assertIn(bob, members)

    async def test_remove_member(self):
        alice = await _make_user('alice@example.com', 'Alice')
        bob = await _make_user('bob@example.com', 'Bob')
        household = await _make_household('Test', alice)
        await sync_to_async(household.add_member)(bob)
        await sync_to_async(household.remove_member)(bob)
        members = await sync_to_async(list)(household.members.all())
        self.assertNotIn(bob, members)

    async def test_remove_last_member_deletes_household(self):
        alice = await _make_user('alice@example.com', 'Alice')
        household = await _make_household('Test', alice)
        pk = household.pk
        await sync_to_async(household.remove_member)(alice)
        exists = await Household.objects.filter(pk=pk).aexists()
        self.assertFalse(exists)

    async def test_get_members_returns_all(self):
        alice = await _make_user('alice@example.com', 'Alice')
        bob = await _make_user('bob@example.com', 'Bob')
        household = await _make_household('Test', alice)
        await sync_to_async(household.add_member)(bob)
        members = await sync_to_async(list)(household.get_members())
        self.assertEqual(len(members), 2)



class HouseholdSerializerTests(TestCase):

    async def asyncSetUp(self):
        self.alice = await _make_user('alice@example.com', 'Alice')
        self.bob = await _make_user('bob@example.com', 'Bob')
        self.household = await _make_household('Test', self.alice)
        await sync_to_async(self.household.add_member)(self.bob)

    async def test_includes_expected_fields(self):
        data = await sync_to_async(lambda: HouseholdSerializer(self.household).data)()
        for field in ('id', 'name', 'members', 'member_count', 'pending_invitations'):
            self.assertIn(field, data)

    async def test_member_count(self):
        data = await sync_to_async(lambda: HouseholdSerializer(self.household).data)()
        self.assertEqual(data['member_count'], 2)

    async def test_members_list_contains_both_users(self):
        data = await sync_to_async(lambda: HouseholdSerializer(self.household).data)()
        member_ids = [m['id'] for m in data['members']]
        self.assertIn(self.alice.pk, member_ids)
        self.assertIn(self.bob.pk, member_ids)

    async def test_pending_invitations_empty_when_none(self):
        data = await sync_to_async(lambda: HouseholdSerializer(self.household).data)()
        self.assertEqual(data['pending_invitations'], [])

    async def test_pending_invitations_shows_pending_email(self):
        await sync_to_async(HouseholdInvitation.objects.create_invitation)(
            self.household, 'charlie@example.com'
        )
        data = await sync_to_async(lambda: HouseholdSerializer(self.household).data)()
        emails = [inv['email'] for inv in data['pending_invitations']]
        self.assertIn('charlie@example.com', emails)



class HouseholdListCreateViewTests(TestCase):

    async def asyncSetUp(self):
        self.alice = await _make_user('alice@example.com', 'Alice')
        self.household = await _make_household('Alice House', self.alice)

    async def test_list_includes_memberships_and_invitations_keys(self):
        await self.async_client.aforce_login(self.alice)
        response = await self.async_client.get(reverse('household-list-create'))
        data = response.json()
        self.assertIn('memberships', data)
        self.assertIn('invitations', data)

    async def test_list_includes_user_household(self):
        await self.async_client.aforce_login(self.alice)
        response = await self.async_client.get(reverse('household-list-create'))
        names = [h['name'] for h in response.json()['memberships']]
        self.assertIn('Alice House', names)

    async def test_list_includes_pending_invitations_for_user(self):
        bob = await _make_user('bob@example.com', 'Bob')
        await sync_to_async(HouseholdInvitation.objects.create_invitation)(
            self.household, 'bob@example.com'
        )
        await self.async_client.aforce_login(bob)
        response = await self.async_client.get(reverse('household-list-create'))
        invitations = response.json()['invitations']
        self.assertEqual(len(invitations), 1)
        self.assertEqual(invitations[0]['household_name'], 'Alice House')


class HouseholdDetailViewTests(TestCase):

    async def asyncSetUp(self):
        self.alice = await _make_user('alice@example.com', 'Alice')
        self.bob = await _make_user('bob@example.com', 'Bob')
        self.household = await _make_household('Test House', self.alice)

    async def test_get_returns_household(self):
        await self.async_client.aforce_login(self.alice)
        response = await self.async_client.get(
            reverse('household-detail', args=[self.household.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['name'], 'Test House')

    async def test_patch_updates_name(self):
        await self.async_client.aforce_login(self.alice)
        response = await self.async_client.patch(
            reverse('household-detail', args=[self.household.pk]),
            data='{"name": "Renamed House"}',
            content_type='application/json',
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['name'], 'Renamed House')


class HouseholdSummaryViewTests(TestCase):

    async def asyncSetUp(self):
        self.alice = await _make_user('alice@example.com', 'Alice')
        self.bob = await _make_user('bob@example.com', 'Bob')
        self.household = await _make_household('Test House', self.alice)
        await sync_to_async(self.household.add_member)(self.bob)

    async def test_get_summary_returns_other_members(self):
        await self.async_client.aforce_login(self.alice)
        response = await self.async_client.get(
            reverse('household-summary', args=[self.household.pk])
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn(str(self.bob.pk), response.json())

    async def test_summary_does_not_include_requesting_user(self):
        await self.async_client.aforce_login(self.alice)
        response = await self.async_client.get(
            reverse('household-summary', args=[self.household.pk])
        )



class HouseholdLeaveViewTests(TestCase):

    async def asyncSetUp(self):
        self.alice = await _make_user('alice@example.com', 'Alice')
        self.bob = await _make_user('bob@example.com', 'Bob')
        self.household = await _make_household('Test House', self.alice)
        await sync_to_async(self.household.add_member)(self.bob)

    async def test_leave_removes_user_from_household(self):
        await self.async_client.aforce_login(self.bob)
        await self.async_client.post(
            reverse('household-leave', args=[self.household.pk])
        )
        members = await sync_to_async(list)(self.household.members.all())
        self.assertNotIn(self.bob, members)

    async def test_last_member_leaving_deletes_household(self):
        pk = self.household.pk
        await self.async_client.aforce_login(self.alice)
        await self.async_client.post(reverse('household-leave', args=[pk]))
        await self.async_client.aforce_login(self.bob)
        await self.async_client.post(reverse('household-leave', args=[pk]))
        exists = await Household.objects.filter(pk=pk).aexists()
        self.assertFalse(exists)



@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class HouseholdInviteViewTests(TestCase):

    async def asyncSetUp(self):
        self.alice = await _make_user('alice@example.com', 'Alice')
        self.household = await _make_household('Test House', self.alice)
        await self.async_client.aforce_login(self.alice)

    async def test_invite_creates_pending_invitation(self):
        await self.async_client.post(
            reverse('household-invite', args=[self.household.pk]),
            data='{"email": "bob@example.com"}',
            content_type='application/json',
        )
        exists = await HouseholdInvitation.objects.filter(
            household=self.household, email='bob@example.com',
            status=HouseholdInvitation.PENDING,
        ).aexists()
        self.assertTrue(exists)



class InvitationRespondViewTests(TestCase):

    async def asyncSetUp(self):
        self.alice = await _make_user('alice@example.com', 'Alice')
        self.bob = await _make_user('bob@example.com', 'Bob')
        self.household = await _make_household('Test House', self.alice)
        self.inv = await sync_to_async(HouseholdInvitation.objects.create_invitation)(
            self.household, 'bob@example.com'
        )

    async def test_accept_adds_user_to_household(self):
        await self.async_client.aforce_login(self.bob)
        await self.async_client.post(
            reverse('invitation-respond', args=[self.inv.token]),
            data='{"action": "accept"}',
            content_type='application/json',
        )
        members = await sync_to_async(list)(self.household.members.all())
        self.assertIn(self.bob, members)

    async def test_decline_does_not_add_user_to_household(self):
        await self.async_client.aforce_login(self.bob)
        await self.async_client.post(
            reverse('invitation-respond', args=[self.inv.token]),
            data='{"action": "decline"}',
            content_type='application/json',
        )
        members = await sync_to_async(list)(self.household.members.all())
        self.assertNotIn(self.bob, members)


class BillsByPersonViewTests(TestCase):

    async def asyncSetUp(self):
        self.alice = await _make_user('alice@example.com', 'Alice')
        self.bob = await _make_user('bob@example.com', 'Bob')
        self.household = await _make_household('Test House', self.alice)
        await sync_to_async(self.household.add_member)(self.bob)
        self.bill = await _make_bill(
            'Dinner', self.household, Decimal('60.00'),
            self.alice, {self.bob.pk: Decimal('60.00')},
        )

    def _url(self):
        return reverse('bills-by-person', args=[self.household.pk, self.bob.pk])

    async def test_response_has_bills_and_they_owe_me(self):
        await self.async_client.aforce_login(self.alice)
        data = (await self.async_client.get(self._url())).json()
        self.assertIn('bills', data)
        self.assertIn('they_owe_me', data)

    async def test_bill_appears_in_response(self):
        await self.async_client.aforce_login(self.alice)
        data = (await self.async_client.get(self._url())).json()
        bill_ids = [b['id'] for b in data['bills']]
        self.assertIn(self.bill.pk, bill_ids)

    async def test_they_owe_me_equals_unresolved_debt_total(self):
        await self.async_client.aforce_login(self.alice)
        data = (await self.async_client.get(self._url())).json()
        self.assertEqual(Decimal(str(data['they_owe_me'])), Decimal('60.00'))

    async def test_resolved_debt_excluded_from_total(self):
        debt = await Debt.objects.aget(bill=self.bill, user_owing=self.bob)
        debt.is_resolved = True
        await sync_to_async(debt.save)()
        await self.async_client.aforce_login(self.alice)
        data = (await self.async_client.get(self._url())).json()
        self.assertEqual(data['they_owe_me'], 0)

    async def test_only_bills_owed_to_requesting_user_returned(self):
        charlie = await _make_user('charlie@example.com', 'Charlie')
        await sync_to_async(self.household.add_member)(charlie)
        await _make_bill(
            "Bob's Bill", self.household, Decimal('20.00'),
            self.bob, {charlie.pk: Decimal('20.00')},
        )
        await self.async_client.aforce_login(self.alice)
        data = (await self.async_client.get(self._url())).json()
        bill_names = [b['name'] for b in data['bills']]
        self.assertNotIn("Bob's Bill", bill_names)



class DebtsByPersonViewTests(TestCase):

    async def asyncSetUp(self):
        self.alice = await _make_user('alice@example.com', 'Alice')
        self.bob = await _make_user('bob@example.com', 'Bob')
        self.household = await _make_household('Test House', self.alice)
        await sync_to_async(self.household.add_member)(self.bob)
        # bob is owed by alice
        self.bill = await _make_bill(
            'Groceries', self.household, Decimal('40.00'),
            self.bob, {self.alice.pk: Decimal('40.00')},
        )

    def _url(self):
        return reverse('debts-by-person', args=[self.household.pk, self.bob.pk])

    async def test_response_has_debts_and_i_owe_them(self):
        await self.async_client.aforce_login(self.alice)
        data = (await self.async_client.get(self._url())).json()
        self.assertIn('debts', data)
        self.assertIn('i_owe_them', data)

    async def test_debt_appears_in_response(self):
        await self.async_client.aforce_login(self.alice)
        data = (await self.async_client.get(self._url())).json()
        self.assertEqual(len(data['debts']), 1)
        self.assertEqual(data['debts'][0]['bill_name'], 'Groceries')

    async def test_i_owe_them_equals_unresolved_debt_total(self):
        await self.async_client.aforce_login(self.alice)
        data = (await self.async_client.get(self._url())).json()
        self.assertEqual(Decimal(str(data['i_owe_them'])), Decimal('40.00'))

    async def test_resolved_debt_excluded_from_total(self):
        debt = await Debt.objects.aget(bill=self.bill, user_owing=self.alice)
        debt.is_resolved = True
        await sync_to_async(debt.save)()
        await self.async_client.aforce_login(self.alice)
        data = (await self.async_client.get(self._url())).json()
        self.assertEqual(data['i_owe_them'], 0)

    async def test_only_debts_owed_to_other_user_returned(self):
        charlie = await _make_user('charlie@example.com', 'Charlie')
        await sync_to_async(self.household.add_member)(charlie)
        await _make_bill(
            "Charlie's Bill", self.household, Decimal('30.00'),
            charlie, {self.alice.pk: Decimal('30.00')},
        )
        await self.async_client.aforce_login(self.alice)
        data = (await self.async_client.get(self._url())).json()
        bill_names = [d['bill_name'] for d in data['debts']]
        self.assertNotIn("Charlie's Bill", bill_names)
